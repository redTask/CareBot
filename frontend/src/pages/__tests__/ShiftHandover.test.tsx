import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import ShiftHandover from "../ShiftHandover"

// Mock the fetch API
global.fetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("ShiftHandover", () => {
  it("renders loading state initially", () => {
    render(<ShiftHandover />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("renders shift handover report", () => {
    render(<ShiftHandover />)
    expect(screen.getByRole("heading", { name: /shift handover/i })).toBeInTheDocument()
  })

  it("has shift duration selector", () => {
    render(<ShiftHandover />)
    expect(screen.getByText(/8h/)).toBeInTheDocument()
    expect(screen.getByText(/12h/)).toBeInTheDocument()
    expect(screen.getByText(/24h/)).toBeInTheDocument()
  })
})