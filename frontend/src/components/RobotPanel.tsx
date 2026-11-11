import { Robot } from "../store/useStore"
import { getLang, t } from "../lib/i18n"

const STATUS_CONFIG: Record<string, { color: string; labelKey: string }> = {
  idle: { color: "bg-green-100 text-green-700", labelKey: "status_idle" },
  busy: { color: "bg-blue-100 text-blue-700", labelKey: "status_busy" },
  charging: { color: "bg-indigo-100 text-indigo-700", labelKey: "status_charging" },
  offline: { color: "bg-gray-100 text-gray-700", labelKey: "status_offline" },
  stopped: { color: "bg-red-100 text-red-700", labelKey: "status_stopped" },
}

const ML_STATUS_TEXT: Record<string, string> = {
  status_idle: "ഇഡൽ",
  status_busy: "ബിസി",
  status_charging: "ചാർജ് ചെയ്യുന്നു",
  status_offline: "ഓഫ്‌ലൈൻ",
  status_stopped: "തടഞ്ഞു",
}

export default function RobotPanel({ robots }: { robots: Robot[] }) {
  const lang = getLang()

  return (
    <section className="bg-white rounded-xl shadow border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-base">{t("robots")}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {robots.length} {t("online_count", { count: robots.length })}
        </span>
      </div>
      <div className="space-y-2">
        {robots.map((robot) => {
          const cfg = STATUS_CONFIG[robot.status] ?? STATUS_CONFIG.idle
          const batteryColor =
            robot.battery > 50 ? "text-green-600" : robot.battery > 20 ? "text-amber-600" : "text-red-600"
          const statusText = lang === "ml" ? ML_STATUS_TEXT[cfg.labelKey] : t(cfg.labelKey)
          return (
            <div
              key={robot.id}
              className="flex items-center justify-between p-2.5 rounded border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
              role="button"
              tabIndex={0}
              aria-label={`Robot ${robot.name}, status ${robot.status}, battery ${robot.battery} percent`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${robot.status === "charging" ? "animate-pulse" : ""} ${
                    robot.status === "idle" ? "bg-green-400" : robot.status === "busy" ? "bg-blue-400" : robot.status === "stopped" ? "bg-red-400" : "bg-gray-400"
                  }`}
                  aria-hidden="true"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-700">{robot.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.color} px-1.5 py-0.5 rounded`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    ({robot.x.toFixed(1)}, {robot.y.toFixed(1)}) &bull;
                    Task {robot.current_task_id ?? "—"}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold {batteryColor}">{robot.battery}%</div>
                <div className="text-[10px] text-gray-500 capitalize">{robot.status}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
