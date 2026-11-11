import { useAppStore } from "../store/useStore"
import { acknowledgeAlert } from "../lib/api"
import { getLang, t } from "../lib/i18n"

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; dot: string; labelKey: string }> = {
  critical: { color: "text-red-700", bg: "bg-red-100", dot: "bg-red-500", labelKey: "severity_critical" },
  watch: { color: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500", labelKey: "severity_watch" },
  info: { color: "text-blue-700", bg: "bg-blue-100", dot: "bg-blue-500", labelKey: "severity_info" },
}

const ML_SEVERITY_TEXT: Record<string, string> = {
  severity_critical: "ക്രിട്ടിക്കൽ",
  severity_watch: "眾今",
  severity_info: "വിവരങ്ങൾ",
}

export default function AlertsPanel() {
  const { alerts, acknowledgeAlert: ackAlert, user } = useAppStore()
  const lang = getLang()

  const openAlerts = alerts.filter((a) => a.status === "open")

  if (openAlerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 text-base mb-4">{t("open_alerts")}</h3>
        <p className="text-sm text-gray-500">{t("no_active_alerts")}</p>
      </div>
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
    lang === "ml" ? ML_SEVERITY_TEXT[key] : t(key)

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-base">{t("open_alerts")}</h3>
        <span className="text-xs font-bold uppercase tracking-wider text-red-600">
          {openAlerts.length} {t("active", { count: openAlerts.length })}
        </span>
      </div>
      <div className="space-y-3">
        {openAlerts.map((a) => {
          const cfg = SEVERITY_CONFIG[a.severity] ?? SEVERITY_CONFIG.info
          return (
            <div
              key={a.id}
              className={`flex items-center justify-between p-3 rounded-xl border bg-white border-${
                a.severity === "critical" ? "red" : a.severity === "watch" ? "amber" : "blue"
              }-200`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                      {severityText(cfg.labelKey)}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {t("level", { level: a.escalation_level })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-800">{a.message}</div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {a.patient_id != null ? `Patient #${a.patient_id}` : "System"} &bull;
                    {new Date(a.created_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAcknowledge(a.id)}
                disabled={a.status !== "open"}
                className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                  a.severity === "critical"
                    ? "bg-red-600 text-white border-red-700 hover:bg-red-700 disabled:opacity-60"
                    : "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 disabled:opacity-60"
                }`}
              >
                {t("acknowledge")}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
