import { useAppStore } from "../store/useStore"

let ws: WebSocket | null = null
let reconnectTimer: number | null = null

export function connectWS(url: string, token: string | null) {
  if (ws) {
    ws.close()
  }
  const wsUrl = `${url}/ws${token ? `?token=${encodeURIComponent(token)}` : ""}`
  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    useAppStore.getState().setOnline(true)
    useAppStore.getState().setLastUpdated(new Date().toISOString())
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      useAppStore.getState().setLastUpdated(new Date().toISOString())
      if (msg.type === "vital" && msg.data) {
        useAppStore.getState().upsertVital(msg.data)
      } else if (msg.type === "robot" || msg.type === "robot_updated") {
        if (msg.data) useAppStore.getState().upsertRobot(msg.data)
      } else if (msg.type === "alert_created" && msg.data) {
        useAppStore.getState().addAlert(msg.data)
      } else if (msg.type === "alert_updated" && msg.data) {
        useAppStore.getState().updateAlert(msg.data)
      } else if (msg.type === "alert_acknowledged" && msg.data) {
        useAppStore.getState().acknowledgeAlert(
          msg.data.id,
          msg.data.acknowledged_by ?? null
        )
      } else if (msg.type === "alert_escalated" && msg.data) {
        useAppStore.getState().updateAlert(msg.data)
      } else if (msg.type === "alert_resolved" && msg.data) {
        useAppStore.getState().resolveAlert(msg.data.id)
      } else if (msg.type === "task_created" && msg.data) {
        useAppStore.getState().addTask(msg.data)
      } else if (msg.type === "task_updated" && msg.data) {
        useAppStore.getState().updateTask(msg.data)
      } else if (msg.type === "medication_event" && msg.data) {
        useAppStore.getState().addMedicationEvent(msg.data)
        if (msg.data.acknowledged || msg.data.missed) {
          useAppStore.getState().updateMedicationEvent(msg.data)
        }
      } else if (msg.type === "estop_activated" && msg.data) {
        const { robots: stoppedIds } = msg.data
        useAppStore
          .getState()
          .setRobots(
            useAppStore.getState().robots.map((r) =>
              stoppedIds.includes(r.id) ? { ...r, status: "stopped" } : r
            )
          )
      } else if (msg.type === "estop_resumed" && msg.data) {
        const { robots: resumedIds } = msg.data
        useAppStore
          .getState()
          .setRobots(
            useAppStore.getState().robots.map((r) =>
              resumedIds.includes(r.id) ? { ...r, status: "idle" } : r
            )
          )
      }
    } catch (err) {
      console.warn("Failed to parse WS message", err)
    }
  }

  ws.onclose = () => {
    useAppStore.getState().setOnline(false)
    ws = null
    // Auto-reconnect after 3 seconds
    reconnectTimer = window.setTimeout(() => {
      const { token } = useAppStore.getState()
      connectWS(url, token)
    }, 3000)
  }

  ws.onerror = () => {
    useAppStore.getState().setOnline(false)
  }

  return ws
}

export function disconnectWS() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
  useAppStore.getState().setOnline(false)
}

export function getWS() {
  return ws
}
