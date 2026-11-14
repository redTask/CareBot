import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import ImpactPage from "../ImpactPage"

// Mock the fetch API
globalThis.fetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ImpactPage", () => {
  it("renders loading state initially", () => {
    ;(fetch as any).mockResolvedValueOnce({} as any)
    ;(fetch as any).mockResolvedValueOnce({} as any)
    ;(fetch as any).mockResolvedValueOnce({} as any)

    render(<ImpactPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("renders impact page title", () => {
    ;(fetch as any).mockResolvedValueOnce(
      {} as any
    ) as any
    ;(fetch as any).mockResolvedValueOnce(
      {} as any
    ) as any
    ;(fetch as any).mockResolvedValueOnce(
      {} as any
    ) as any

    render(<ImpactPage />)
    expect(screen.getByRole("heading", { name: /impact/i })).toBeInTheDocument()
  })
})