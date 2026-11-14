import { useEffect, useRef, useState } from "react"
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
  const cancelRef = useRef<HTMLButtonElement | null>(null)

  const stopped = robots.some((robot) => robot.status === "stopped")
  const canResume = user?.role === "nurse" || user?.role === "doctor"

  // Escape closes the confirmation dialog.
  useEffect(() => {
    if (!confirming) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfirming(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [confirming])

  // Cancel is the safe default, so it takes focus when the dialog opens.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
  }, [confirming])

  const handleEstop = async () => {
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
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-teal bg-lime px-3 text-xs font-bold text-navy transition-colors hover:bg-mint disabled:opacity-60"
        >
          <Icon name="power" size={16} />
          {t("resume")}
        </button>
      )}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-haspopup="dialog"
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-alert px-4 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:brightness-90"
        title={t("emergency_stop")}
        aria-label={`E-STOP — ${t("emergency_stop")}`}
      >
        <Icon name="alert-triangle" size={20} />
        <span>E-STOP</span>
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirming(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="estop-dialog-title"
            aria-describedby="estop-dialog-description"
            className="w-full max-w-sm rounded-2xl border border-line bg-white p-5 shadow-card"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-alert text-white">
              <Icon name="alert-triangle" size={24} />
            </div>
            <h2 id="estop-dialog-title" className="text-center text-lg font-bold text-navy">
              {t("emergency_stop")}
            </h2>
            <p
              id="estop-dialog-description"
              className="mt-2 text-center text-sm font-medium text-navy/70"
            >
              {t("estop_confirm_body")}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleEstop}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-alert px-4 text-base font-bold text-white transition-colors hover:brightness-90 disabled:opacity-60"
              >
                {t("confirm_stop")}
              </button>
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-teal bg-white px-4 text-base font-bold text-navy transition-colors hover:bg-brand-tint"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
