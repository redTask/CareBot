import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { API_BASE } from "../lib/api"
import { t } from "../lib/i18n"
import Icon from "./Icon"

async function post(token: string | null, path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return res.json()
}

export default function EStopButton() {
  const token = useAppStore((state) => state.token)
  const user = useAppStore((state) => state.user)
  const robots = useAppStore((state) => state.robots)
  const setRobots = useAppStore((state) => state.setRobots)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const stopped = robots.some((robot) => robot.status === "stopped")
  const canResume = user?.role === "nurse" || user?.role === "doctor"

  const handleEstop = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setBusy(true)
    try {
      await post(token, "/alerts/estop")
      setRobots(robots.map((robot) => ({ ...robot, status: "stopped" })))
      setConfirming(false)
    } catch (err) {
      console.error("E-stop error", err)
    } finally {
      setBusy(false)
    }
  }

  const handleResume = async () => {
    setBusy(true)
    try {
      await post(token, "/alerts/resume")
      setRobots(
        robots.map((robot) =>
          robot.status === "stopped" ? { ...robot, status: "idle" } : robot
        )
      )
    } catch (err) {
      console.error("Resume error", err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {stopped && canResume && (
        <button
          type="button"
          onClick={handleResume}
          disabled={busy}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-normal-light px-3 text-xs font-bold text-normal-dark transition-colors hover:bg-[#D7F2E1] disabled:opacity-60"
        >
          <Icon name="power" size={16} />
          {t("resume")}
        </button>
      )}
      {confirming ? (
        <button
          type="button"
          onClick={handleEstop}
          disabled={busy}
          className="inline-flex min-h-[40px] items-center rounded-full bg-[#B91C1C] px-4 text-xs font-bold uppercase tracking-wide text-white ring-2 ring-[#FCA5A5] transition-colors hover:bg-[#991B1B] disabled:opacity-60"
          onBlur={() => setConfirming(false)}
        >
          {t("confirm_stop")}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleEstop}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#DC2626] px-4 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-[#B91C1C]"
          title={t("emergency_stop")}
          aria-label={t("emergency_stop")}
        >
          <Icon name="alert-triangle" size={20} />
          <span>E-STOP</span>
        </button>
      )}
    </div>
  )
}
