import { useAppStore } from "../store/useStore"
import { acknowledgeAlert } from "../lib/api"
import { t } from "../lib/i18n"
import { formatTime } from "../lib/format"
import Card from "./Card"
import SectionHead from "./SectionHead"
import EmptyState from "./EmptyState"
import Icon from "./Icon"

// Severity styling stays inside the palette. Critical is navy-filled with a
// thick border; red is reserved for the critical banner only.
const SEVERITY: Record<
  string,
  { dot: string; text: string; border: string; icon: string; solid: boolean; labelKey: string }
> = {
  critical: {
    dot: "bg-navy",
    text: "text-navy",
    border: "border-navy border-2 bg-navy/[0.05]",
    icon: "alert-triangle",
    solid: true,
    labelKey: "severity_critical",
  },
  watch: {
    dot: "bg-teal",
    text: "text-navy",
    border: "border-teal/40 bg-watch-light",
    icon: "alert-circle",
    solid: false,
    labelKey: "severity_watch",
  },
  info: {
    dot: "bg-mint",
    text: "text-navy",
    border: "border-line",
    icon: "activity",
    solid: false,
    labelKey: "severity_info",
  },
}

export default function AlertsPanel() {
  const alerts = useAppStore((state) => state.alerts)
  const ackAlert = useAppStore((state) => state.acknowledgeAlert)
  const user = useAppStore((state) => state.user)
  const patients = useAppStore((state) => state.patients)

  const openAlerts = alerts.filter((alert) => alert.status === "open")

  const patientName = (patientId: number | null | undefined) => {
    if (patientId == null) return t("system")
    return patients[patientId]?.name ?? t("patient_x", { id: patientId })
  }

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
              <div key={alert.id} className={`rounded-xl border p-3 ${cfg.border}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} aria-hidden="true" />
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-navy">
                    <Icon name={cfg.icon as any} size={16} />
                    {t(cfg.labelKey)}
                  </span>
                  {alert.escalation_level > 0 && (
                    <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-navy/70">
                      {t("escalated", {
                        role:
                          alert.escalation_level >= 2
                            ? t("escalated_doctor")
                            : t("escalated_nurse"),
                      })}
                    </span>
                  )}
                </div>
                {/* Who the alert is about — the most prominent line. */}
                <p className="mt-1.5 break-words text-lg font-bold leading-snug text-navy">
                  {patientName(alert.patient_id)}
                </p>
                <p className="mt-0.5 break-words text-sm font-medium text-navy/70">
                  {alert.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-navy/60">
                    {formatTime(alert.created_at)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={alert.status !== "open"}
                    className={[
                      "inline-flex min-h-[36px] items-center rounded-lg px-3 text-xs font-bold transition-colors disabled:opacity-50",
                      cfg.solid
                        ? "bg-navy text-white hover:bg-navy/90"
                        : "border border-teal bg-white text-navy hover:bg-brand-tint",
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
