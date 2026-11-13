import { useEffect, useState } from "react"
import { t } from "../lib/i18n"
import { success, error } from "../lib/toast"
import { useAppStore } from "../store/useStore"
import Card from "./Card"
import Icon from "./Icon"

type TouchButton = {
  label: string
  alertType: string
  taskType: string
  priority: "emergency" | "high" | "medium"
}

const TOUCH_BUTTONS: TouchButton[] = [
  { label: "Call nurse", alertType: "patient_call", taskType: "visit_bed", priority: "emergency" },
  { label: "Water", alertType: "patient_call", taskType: "hydration", priority: "medium" },
  { label: "Pain", alertType: "pain_request", taskType: "pain_round", priority: "high" },
  { label: "Cancel", alertType: "cancel", taskType: "none", priority: "medium" },
]

function RobotTouchscreen() {
  const { token } = useAppStore.getState()
  const [showConfirm, setShowConfirm] = useState<{ button: string } | null>(null)
  const [lastAction, setLastAction] = useState<string | null>(null)

  const handleButton = async (button: TouchButton) => {
    if (button.alertType === "cancel") {
      setShowConfirm({ button: "cancel" })
      return
    }

    try {
      // Create alert via API
      const alertRes = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/alerts/${button.alertType}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!alertRes.ok) throw new Error("Alert failed")

      // Auto-dispatch task if not cancel
      if (button.taskType !== "none") {
        await fetch(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/tasks`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: button.taskType,
              priority: button.priority,
            }),
          }
        )
      }

      setLastAction(button.label)
      setShowConfirm({ button: "confirm" })
      success(t("toast_success"), t("high_priority_alert"))
    } catch (e: any) {
      error(t("toast_error"), e?.message || "Failed to notify")
    }
  }

  useEffect(() => {
    // Auto-close confirm dialog after 3s
    const timer = setTimeout(() => setShowConfirm(null), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!showConfirm && !lastAction) {
    return null // Will render buttons below
  }

  // This section shows after an action
  if (lastAction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card padded className="max-w-sm text-center">
          <Icon name="check-circle" size={24} className="text-success w-16 h-16 mb-3" />
          <h3 className="text-xl font-bold mb-2">A nurse has been notified</h3>
          <p className="text-[#475569] mb-6">
            {lastAction === "Call nurse"
              ? "A high-priority patient call alert has been created and a nurse visit task has been auto-dispatched."
              : "Notification sent."}
          </p>
          <button
            onClick={() => setShowConfirm(null)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0F172A] bg-brand-tint border border-brand-tint rounded-md hover:bg-brand-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            OK
          </button>
        </Card>
      </div>
    )
  }

  // Render touch buttons
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F4F6FB]">
      <Card padded className="max-w-full p-6 space-y-3">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-6">Robot Touchscreen</h2>

        {TOUCH_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            onClick={() => handleButton(btn)}
            className={`w-full rounded-xl border-2 border-brand-tint bg-brand-tint text-white px-6 py-4 text-lg font-medium transition-colors hover:bg-brand-tint/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 min-h-[64px]`}
            aria-label={btn.label}
          >
            <Icon name="hand-pointer" size={20} className="mr-3 align-middle" />
            {btn.label}
          </button>
        ))}

        {showConfirm && showConfirm.button !== "cancel" && (
          <div className="mt-4 max-w-sm text-center">
            <Card padded className="max-w-sm">
              <Icon name="check-circle" size={24} className="text-success w-12 h-12 mb-3" />
              <h3 className="text-xl font-bold mb-2">A nurse has been notified</h3>
              <p className="text-[#475569] mb-6">Your request has been sent to the nursing station.</p>
              <button
                onClick={() => setShowConfirm(null)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0F172A] bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
              >
                OK
              </button>
            </Card>
          </div>
        )}

        {showConfirm && showConfirm.button === "cancel" && (
          <div className="mt-4 max-w-sm text-center">
            <Card padded className="max-w-sm">
              <Icon name="x-circle" size={24} className="text-error w-12 h-12 mb-3" />
              <h3 className="text-xl font-bold mb-2">Cancelled</h3>
              <p className="text-[#475569] mb-6">The action has been cancelled.</p>
              <button
                onClick={() => setShowConfirm(null)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0F172A] bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
              >
                OK
              </button>
            </Card>
          </div>
        )}
      </Card>
    </div>
  )
}

export default RobotTouchscreen