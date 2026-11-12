import { useAppStore } from "../store/useStore"
import { acknowledgeAlert } from "../lib/api"
import { getLang, t } from "../lib/i18n"
import Card from "./Card"
import SectionHead from "./SectionHead"

const ML_SEVERITY_TEXT: Record<string, string> = {
  severity_critical: "ക്രിട്ടിക്കൽ",
  severity_watch: "വാച്ച്",
  severity_info: "വിവരങ്ങൾ",
}

const SEVERITY_CONFIG: Record<string, {
  dot: string
  text: string
  border: string
  btn: string
  btnHover: string
  labelKey: string
}> = {
  critical: {
    dot: "bg-critical-dark",
    text: "text-critical-dark",
    border: "border-[#FDE8E8]",
    btn: "bg-[#DC2626] text-white",
    btnHover: "hover:bg-[#B91C1C]",
    labelKey: "severity_critical",
  },
  watch: {
    dot: "bg-watch-dark",
    text: "text-watch-dark",
    border: "border-[#FEF3C7]",
    btn: "bg-[#D97706] text-white",
    btnHover: "hover:bg-[#B45309]",
    labelKey: "severity_watch",
  },
  info: {
    dot: "bg-[#2F6BFF]",
    text: "text-[#2F6BFF]",
    border: "border-[#EAF0FF]",
    btn: "bg-[#2F6BFF] text-white",
    btnHover: "hover:bg-[#1F55D6]",
    labelKey: "severity_info",
  },
}

export default function AlertsPanel() {
  const { alerts, acknowledgeAlert: ackAlert, user } = useAppStore()
  const lang = getLang()

  const openAlerts = alerts.filter((a) => a.status === "open")

  if (openAlerts.length === 0) {
    return (
      <Card>
        <SectionHead title={t("open_alerts")} caption={t("no_active_alerts")} />
      </Card>
    )
  }

  const handleAcknowledge = async (id: number) => {
    try {
      await acknowledgeAlert(id)
      ackAlert(id, user?.id ?? null)
    } catch (err) {
      console.error("Failed to acknowledge alert", err)
    }
  }

  const severityText = (key: string) =>
    lang === "ml" ? (ML_SEVERITY_TEXT[key] ?? t(key)) : t(key)

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <SectionHead title={t("open_alerts")} />
        <span className={`text-xs font-bold uppercase tracking-wider ${SEVERITY_CONFIG.critical.text}`}>
          {openAlerts.length} {t("active", { count: openAlerts.length })}
        </span>
      </div>
      <div className="space-y-3">
        {openAlerts.map((a) => {
          const cfg = SEVERITY_CONFIG[a.severity] ?? SEVERITY_CONFIG.info
          const isCritical = a.severity === "critical"
          return (
            <div
              key={a.id}
              className={[
                "flex items-center justify-between p-4 rounded-xl border bg-white transition-all duration-150",
                cfg.border,
                isCritical ? "animate-ring shadow-[0_0_0_0_rgba(220,38,38,0.25)]" : "",
              ]
                .filter(Boolean)
                .join(" "}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "text-xs font-bold uppercase tracking-wider",
                        lang === "ml" ? "ml-font" : "",
                        cfg.text,
                      ]
                        .filter(Boolean)
                        .join(" "}
                    >
                      {severityText(cfg.labelKey)}
                    </span>
                    <span className="text-xs text-[#94A3B8] ml-auto">
                      {t("level", { level: a.escalation_level })}
                    </span>
                  </div>
                  <div className="text-sm text-[#0F172A]">{a.message}</div>
                  <div className="text-xs text-[#94A3B8] mt-1">
                    {a.patient_id != null ? t("patient_x", { id: a.patient_id }) : t("system")} •{" "}
                    {new Date(a.created_at!).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledge(a.id)}
                disabled={a.status !== "open"}
                className={`min-h-[40px] px-3 py-2 rounded text-sm font-semibold ${cfg.btn} ${cfg.btnHover} transition-all duration-150 disabled:opacity-60`}
              >
                {t("acknowledge")}
              </button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
