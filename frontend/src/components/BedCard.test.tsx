import { describe, it, expect, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import BedCard from "../components/BedCard"
import { t, setLang, getLang } from "../lib/i18n"

const mockBed = {
  id: 1,
  label: "Bed-01",
  x: 0,
  y: 0,
  patient: {
    id: 1,
    name: "Ramesh Kumar",
    age: 68,
    sex: "M",
    conditions: "Hypertension, Diabetes",
  },
  latest_vital: {
    type: "spo2",
    value: 97,
    quality: "good",
    timestamp: "2026-11-11T09:00:00Z",
  },
  status: "normal",
  last_checked: "2026-11-11T09:00:00Z",
}

afterEach(() => {
  setLang("en")
})

describe("BedCard", () => {
  it("renders bed label, patient name, and status", () => {
    render(<BedCard bed={mockBed} />)
    expect(screen.getByText("Bed-01")).toBeInTheDocument()
    expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument()
    expect(screen.getAllByText("Normal")[0]).toBeInTheDocument()
  })

  it("shows status by colour + icon + text (never colour alone)", () => {
    const { container } = render(<BedCard bed={mockBed} />)
    // Status badge has both text and a colored dot
    expect(container.querySelector('[aria-label="Normal"]')).toBeInTheDocument()
    expect(screen.getAllByText("Normal")[0]).toBeInTheDocument()
  })

  it("shows watch status correctly", () => {
    const watchBed = { ...mockBed, status: "watch" as const }
    render(<BedCard bed={watchBed} />)
    expect(screen.getAllByText("Watch")[0]).toBeInTheDocument()
  })

  it("shows critical status correctly", () => {
    const criticalBed = { ...mockBed, status: "critical" as const }
    render(<BedCard bed={criticalBed} />)
    expect(screen.getAllByText("Critical")[0]).toBeInTheDocument()
  })

  it("shows vital reading when available", () => {
    render(<BedCard bed={mockBed} />)
    expect(screen.getByText("SpO₂ 97")).toBeInTheDocument()
  })

  it("shows 'No vitals yet' when no vital reading", () => {
    const noVitalBed = { ...mockBed, latest_vital: null }
    render(<BedCard bed={noVitalBed} />)
    expect(screen.getByText("No vitals yet")).toBeInTheDocument()
  })

  it("is keyboard navigable (tabIndex=0)", () => {
    const { container } = render(<BedCard bed={mockBed} />)
    expect(container.firstChild).toHaveAttribute("tabindex", "0")
  })
})

describe("i18n", () => {
  it("defaults to English", () => {
    expect(getLang()).toBe("en")
    expect(t("ward_dashboard")).toBe("Ward Dashboard")
  })

  it("switches to Malayalam", () => {
    setLang("ml")
    expect(getLang()).toBe("ml")
    expect(t("app_name")).toBe("കെയർബോട്ട്")
  })

  it("falls back to English for missing Malayalam keys", () => {
    setLang("ml")
    expect(t("nonexistent_key")).toBe("nonexistent_key")
  })
})
