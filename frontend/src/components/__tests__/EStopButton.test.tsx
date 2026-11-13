import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EStopButton from "../EStopButton"

// Mock the toast
global.alert = vi.fn()

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
    const keydownEvent = new KeyboardEvent("keydown", { key: "Escape" })
    document.dispatchEvent(keydownEvent)
    
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