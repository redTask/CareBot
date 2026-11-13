import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { acknowledgeAlert } from "../lib/api"
import { t } from "../lib/i18n"
import Icon from "./Icon"

const RANK: Record<string, number> = { critical: 0, watch: 1, info: 2 }

export default function CriticalAlertBanner() {
  const alerts = useAppStore((state) => state.alerts)
  const ackAlert = useAppStore((state) => state.acknowledgeAlert)
  const user = useAppStore((state) => state.user)
  const [dismissedId, setDismissedId] = useState<number | null>(null)

  const open = alerts
    .filter((alert) => alert.status === "open" && alert.severity !== "info")
    .sort((a, b) => (RANK[a.severity] ?? 9) - (RANK[b.severity] ?? 9))

  const alert = open[0]
  if (!alert || alert.id === dismissedId) return null

  const critical = alert.severity === "critical"

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert(alert.id)
      ackAlert(alert.id, user?.id ?? null)
    } catch (err) {
      console.error("Failed to acknowledge alert", err)
    }
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        "border-b",
        critical
          ? "border-[#FCA5A5] bg-critical-light text-critical-dark"
          : "border-[#FCD34D] bg-watch-light text-[#854D0E]",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Icon name={critical ? "alert-triangle" : "alert-circle"} size={20} className="shrink-0" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          <span className="mr-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {t(critical ? "severity_critical" : "severity_watch")}
          </span>
          {alert.message}
          {open.length > 1 && (
            <span className="ml-2 font-normal opacity-80">
              (+{open.length - 1})
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={handleAcknowledge}
          className={[
            "inline-flex min-h-[40px] shrink-0 items-center rounded-lg px-3 text-xs font-bold text-white transition-colors",
            critical ? "bg-[#B91C1C] hover:bg-[#991B1B]" : "bg-[#B45309] hover:bg-[#92400E]",
          ].join(" ")}
        >
          {t("acknowledge")}
        </button>
        <button
          type="button"
          onClick={() => setDismissedId(alert.id)}
          aria-label={t("dismiss")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-current/70 hover:bg-white/50"
        >
          <Icon name="x-circle" size={20} />
        </button>
      </div>
    </div>
  )
}
