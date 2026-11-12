import { useAppStore } from "../store/useStore"
import { acknowledgeAlert } from "../lib/api"
import { t } from "../lib/i18n"

export default function CriticalAlertBanner() {
  const { alerts, acknowledgeAlert: ackAlert, user } = useAppStore()

  const criticalAlerts = alerts.filter(
    (a) => a.severity === "critical" && a.status === "open"
  )
  const watchAlerts = alerts.filter(
    (a) => a.severity === "watch" && a.status === "open"
  )

  if (alerts.length === 0) return null

  const hasCritical = criticalAlerts.length > 0

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeAlert(id)
      ackAlert(id, user?.id ?? null)
    } catch (err) {
      console.error("Failed to acknowledge alert", err)
    }
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 px-4 py-3 ${
        hasCritical
          ? "bg-red-500 text-white border-b border-red-700 animate-pulse"
          : "bg-amber-100 text-amber-900 border-b border-amber-300"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {hasCritical && (
            <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              {t("severity_critical")}
            </span>
          )}
          <span className={`font-semibold ${hasCritical ? "text-red-100" : "text-amber-800"}`}>
            {hasCritical
              ? criticalAlerts.length === 1
                ? t("critical_alerts", { count: criticalAlerts.length })
                : t("critical_alerts_plural", { count: criticalAlerts.length })
              : watchAlerts.length === 1
                ? t("watch_alerts", { count: watchAlerts.length })
                : t("watch_alerts_plural", { count: watchAlerts.length })}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[...criticalAlerts, ...watchAlerts]
            .slice(0, 5)
            .map((a) => (
              <button
                key={a.id}
                onClick={() => handleAcknowledge(a.id)}
                disabled={a.status !== "open"}
                className={`min-h-[40px] px-3 py-2 rounded text-sm font-semibold border ${
                  a.severity === "critical"
                    ? "bg-red-600 text-white border-red-700 hover:bg-red-700 disabled:opacity-60"
                    : "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 disabled:opacity-60"
                }`}
              >
                {t("acknowledge")} &bull;
                {a.patient_id != null ? t("patient_x", { id: a.patient_id }) : t("system")}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
