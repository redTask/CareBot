import { describe, it, expect, afterEach } from "vitest"
import { t, setLang, getLang } from "../lib/i18n"

afterEach(() => {
  setLang("en")
})

describe("EStopButton i18n", () => {
  it("emergency_stop translation", () => {
    expect(t("emergency_stop")).toBe("Emergency stop")
  })

  it("resume translation", () => {
    expect(t("resume")).toBe("Resume")
  })

  it("confirm_stop translation", () => {
    expect(t("confirm_stop")).toBe("CONFIRM STOP")
  })

  it("switches to Malayalam", () => {
    setLang("ml")
    expect(getLang()).toBe("ml")
    expect(t("emergency_stop")).toBe("അടിയന്തിര നിർത്തൽ")
    expect(t("resume")).toBe("പുനരാരംഭിക്കുക")
  })

  it("robots_stopped translation", () => {
    expect(t("robots_stopped")).toBe("Robots stopped")
  })
})
