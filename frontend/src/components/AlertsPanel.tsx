import { useAppStore } from "../store/useStore"
import { acknowledgeAlert } from "../lib/api"
import { t } from "../lib/i18n"
import { formatTime } from "../lib/format"
import Card from "./Card"
import SectionHead from "./SectionHead"
import EmptyState from "./EmptyState"

const SEVERITY: Record<
  string,
  { dot: string; text: string; border: string; solid: boolean; labelKey: string }
> = {
  critical: {
    dot: "bg-critical-dark",
    text: "text-critical-dark",
    border: "border-[#FCA5A5] bg-critical-light/30",
    solid: true,
    labelKey: "severity_critical",
  },
  watch: {
    dot: "bg-watch-dark",
    text: "text-watch-dark",
    border: "border-[#FCD34D] bg-watch-light/30",
    solid: true,
    labelKey: "severity_watch",
  },
  info: {
    dot: "bg-[#2F6BFF]",
    text: "text-[#1F55D6]",
    border: "border-[#E6EBF2]",
    solid: false,
    labelKey: "severity_info",
  },
}

export default function AlertsPanel() {
  const alerts = useAppStore((state) => state.alerts)
  const ackAlert = useAppStore((state) => state.acknowledgeAlert)
  const user = useAppStore((state) => state.user)

  const openAlerts = alerts.filter((alert) => alert.status === "open")

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeAlert(id)
      ackAlert(id, user?.id ?? null)
    } catch (err) {
      console.error("Failed to acknowledge alert", err)
    }
  }

  return (
    <Card>
      <SectionHead
        title={t("open_alerts")}
        caption={
          openAlerts.length > 0 ? t("active", { count: openAlerts.length }) : undefined
        }
      />
      {openAlerts.length === 0 ? (
        <EmptyState icon="shield" title={t("no_active_alerts")} />
      ) : (
        <div className="space-y-3">
          {openAlerts.slice(0, 6).map((alert) => {
            const cfg = SEVERITY[alert.severity] ?? SEVERITY.info
            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-3 ${cfg.border}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${cfg.dot}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}
                  >
                    {t(cfg.labelKey)}
                  </span>
                  {alert.escalation_level > 0 && (
                    <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-[#64748B]">
                      {t("escalated", {
                        role:
                          alert.escalation_level >= 2
                            ? t("escalated_doctor")
                            : t("escalated_nurse"),
                      })}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 break-words text-sm text-[#0F172A]">{alert.message}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-[#94A3B8]">
                    {alert.patient_id != null
                      ? t("patient_x", { id: alert.patient_id })
                      : t("system")}{" "}
                    • {formatTime(alert.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={alert.status !== "open"}
                    className={[
                      "inline-flex min-h-[36px] items-center rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-60",
                      cfg.solid
                        ? "bg-[#0F172A] text-white hover:bg-[#1E293B]"
                        : "border border-[#E6EBF2] bg-white text-[#475569] hover:bg-[#F1F4F9]",
                    ].join(" ")}
                  >
                    {t("acknowledge")}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
