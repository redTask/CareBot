import { useAppStore } from "../store/useStore"
import { acknowledgeAlert } from "../lib/api"
import { t } from "../lib/i18n"
import Icon from "./Icon"

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
          ? "bg-[#DC2626] text-white border-b border-[#B91C1C] animate-pulse shadow-lg"
          : "bg-[#FEF3C7] text-[#854D0E] border-b border-[#FCD34D] shadow-sm"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {hasCritical && (
            <span className="bg-[#B91C1C] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              {t("severity_critical")}
            </span>
          )}
          <span className={`font-semibold ${hasCritical ? "text-[#FCA5A5]" : "text-[#854D0E]"}`}>
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
                className={`min-h-[40px] px-3 py-2 rounded text-sm font-semibold border transition-all duration-150 ${
                  a.severity === "critical"
                    ? "bg-[#DC2626] text-white border-[#B91C1C] hover:bg-[#B91C1C] disabled:opacity-60"
                    : "bg-[#D97706] text-white border-[#B45309] hover:bg-[#B45309] disabled:opacity-60"
                }`}
              >
                <Icon name="alert-circle" size={16} className="mr-1.5 opacity-80" aria-hidden="true" />
                {t("acknowledge")} •
                {a.patient_id != null ? t("patient_x", { id: a.patient_id }) : t("system")}
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
