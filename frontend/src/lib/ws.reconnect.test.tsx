import { describe, it, expect, afterEach, beforeEach, vi } from "vitest"
import { connectWS, disconnectWS, getWS } from "./ws"
import { useAppStore } from "../store/useStore"

// Fake WebSocket that records every instance and lets us control open/close.
class FakeWS {
  static instances: FakeWS[] = []
  url: string
  onopen: ((_e: any) => void) | null = null
  onmessage: ((_e: any) => void) | null = null
  onclose: ((_e: any) => void) | null = null
  onerror: ((_e: any) => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    FakeWS.instances.push(this)
  }
  close() {
    this.closed = true
  }
  open() {
    this.onopen?.(null)
  }
  closeEvent() {
    this.closed = true
    this.onclose?.(null)
  }
}

beforeEach(() => {
  FakeWS.instances = []
  // @ts-ignore
  globalThis.WebSocket = FakeWS as any
  vi.useFakeTimers()
})

afterEach(() => {
  disconnectWS()
  vi.useRealTimers()
  // @ts-ignore
  globalThis.WebSocket = undefined as any
})

describe("WS reconnect", () => {
  it("never creates duplicate connections on rapid reconnect cycles", () => {
    const store = useAppStore.getState()
    store.setOnline(true)
    connectWS("ws://example.com", "token-1")

    expect(FakeWS.instances.length).toBe(1)
    const first = FakeWS.instances[0]

    // Simulate the connection dropping -> a 3s reconnect timer is scheduled.
    first.closeEvent()
    vi.advanceTimersByTime(2900)

    // A new connectWS call arrives before the old timer fires (rapid
    // disconnect / reconnect). The old timer must not spawn another socket.
    connectWS("ws://example.com", "token-1")
    vi.advanceTimersByTime(200) // past the old timer's 3s mark

    expect(FakeWS.instances.length).toBe(2) // only the replacement socket
    const current = getWS() as unknown as FakeWS
    expect(current).toBe(FakeWS.instances[1])
    expect(FakeWS.instances[0].closed).toBe(true)

    // Drop the second one too and let the timer reconnect.
    current.closeEvent()
    vi.advanceTimersByTime(3000)
    expect(FakeWS.instances.length).toBe(3)
    expect(getWS()).toBe(FakeWS.instances[2])
  })

  it("does not reconnect after an explicit disconnect", () => {
    connectWS("ws://example.com", null)
    const first = FakeWS.instances[0]
    disconnectWS()
    expect(FakeWS.instances[0].closed).toBe(true)
    // The socket's own close event must not reschedule a reconnect.
    first.closeEvent()
    vi.advanceTimersByTime(10000)
    expect(FakeWS.instances.length).toBe(1)
    expect(getWS()).toBeNull()
  })
})
