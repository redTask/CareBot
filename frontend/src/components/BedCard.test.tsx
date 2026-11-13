import { describe, it, expect, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
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
  latest_vitals: {
    spo2: {
      type: "spo2",
      value: 97,
      quality: "good",
      timestamp: "2026-11-11T09:00:00Z",
    },
    heart_rate: {
      type: "heart_rate",
      value: 78,
      quality: "good",
      timestamp: "2026-11-11T09:00:00Z",
    },
    temperature: {
      type: "temperature",
      value: 36.8,
      quality: "good",
      timestamp: "2026-11-11T09:00:00Z",
    },
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
    render(
      <BrowserRouter>
        <BedCard bed={mockBed} />
      </BrowserRouter>
    )
    expect(screen.getByText("Bed-01")).toBeInTheDocument()
    expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument()
    expect(screen.getAllByText("Normal")[0]).toBeInTheDocument()
  })

  it("shows status by colour + icon + text (never colour alone)", () => {
    render(
      <BrowserRouter>
        <BedCard bed={mockBed} />
      </BrowserRouter>
    )
    // Status badge has visible text + icon; the card exposes an accessible name
    expect(screen.getAllByText("Normal")[0]).toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: /Bed-01, patient Ramesh Kumar, status Normal/,
      })
    ).toBeInTheDocument()
  })

  it("shows watch status correctly", () => {
    const watchBed = { ...mockBed, status: "watch" as const }
    render(
      <BrowserRouter>
        <BedCard bed={watchBed} />
      </BrowserRouter>
    )
    expect(screen.getAllByText("Watch")[0]).toBeInTheDocument()
  })

  it("shows critical status correctly", () => {
    const criticalBed = { ...mockBed, status: "critical" as const }
    render(
      <BrowserRouter>
        <BedCard bed={criticalBed} />
      </BrowserRouter>
    )
    expect(screen.getAllByText("Critical")[0]).toBeInTheDocument()
  })

  it("shows all three vitals when available", () => {
    render(
      <BrowserRouter>
        <BedCard bed={mockBed} />
      </BrowserRouter>
    )
    expect(screen.getByText("97")).toBeInTheDocument()
    expect(screen.getByText("78")).toBeInTheDocument()
    expect(screen.getByText("36.8")).toBeInTheDocument()
  })

  it("shows an empty state for an unoccupied bed", () => {
    const emptyBed = { ...mockBed, patient: null, latest_vitals: {}, latest_vital: null }
    render(
      <BrowserRouter>
        <BedCard bed={emptyBed} />
      </BrowserRouter>
    )
    expect(screen.getByText("Unoccupied")).toBeInTheDocument()
    expect(screen.getByText("No vitals yet")).toBeInTheDocument()
  })

  it("is keyboard navigable (tabIndex=0)", () => {
    const { container } = render(
      <BrowserRouter>
        <BedCard bed={mockBed} />
      </BrowserRouter>
    )
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
