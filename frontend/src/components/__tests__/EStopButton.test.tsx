import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, render, screen, fireEvent } from "@testing-library/react"
import EStopButton from "../EStopButton"

// Mock the toast
globalThis.alert = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("EStopButton", () => {
  it("renders the E-Stop button", () => {
    render(<EStopButton />)
    expect(screen.getByRole("button", { name: /e-stop/i })).toBeInTheDocument()
  })

  it("shows confirmation dialog on click", () => {
    render(<EStopButton />)
    const button = screen.getByRole("button", { name: /e-stop/i })
    fireEvent.click(button)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("closes dialog on Escape key", () => {
    render(<EStopButton />)
    const button = screen.getByRole("button", { name: /e-stop/i })
    fireEvent.click(button)
    
    // Press Escape
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
    })
    
    // Dialog should be closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("has Cancel button with default focus", () => {
    render(<EStopButton />)
    const button = screen.getByRole("button", { name: /e-stop/i })
    fireEvent.click(button)
    
    const cancelButton = screen.getByRole("button", { name: /cancel/i })
    expect(cancelButton).toHaveFocus()
  })
})