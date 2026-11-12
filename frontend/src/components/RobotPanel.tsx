import { Robot } from "../store/useStore"
import { getLang, t } from "../lib/i18n"
import AnimatedNumber from "./AnimatedNumber"
import Card from "./Card"
import Icon from "./Icon"
import SectionHead from "./SectionHead"

const ML_STATUS_TEXT: Record<string, string> = {
  status_idle: "ഇഡൽ",
  status_busy: "ബിസി",
  status_charging: "ചാർജ് ചെയ്യുന്നു",
  status_offline: "ഓഫ്‌ലൈൻ",
  status_stopped: "തടഞ്ഞு",
}

const STATUS_CONFIG: Record<string, {
  dot: string;
  icon: string;
  iconColor: string;
  pill: string;
  pillText: string;
  labelKey: string;
}> = {
  idle: { dot: "bg-normal-dark", icon: "circle-check", iconColor: "text-normal-dark", pill: "bg-normal-light", pillText: "text-normal-dark", labelKey: "status_idle" },
  busy: { dot: "bg-[#2F6BFF]", icon: "monitor", iconColor: "text-[#2F6BFF]", pill: "bg-brand-tint", pillText: "text-[#1F55D6]", labelKey: "status_busy" },
  charging: { dot: "bg-watch-dark", icon: "battery", iconColor: "text-watch-dark", pill: "bg-watch-light", pillText: "text-watch-dark", labelKey: "status_charging" },
  offline: { dot: "bg-[#94A3B8]", icon: "power", iconColor: "text-[#94A3B8]", pill: "bg-[#F1F4F9]", pillText: "text-[#64748B]", labelKey: "status_offline" },
  stopped: { dot: "bg-critical-dark", icon: "alert-circle", iconColor: "text-critical-dark", pill: "bg-critical-light", pillText: "text-critical-dark", labelKey: "status_stopped" },
}

export default function RobotPanel({ robots }: { robots: Robot[] }) {
  const lang = getLang()

  return (
    <Card>
      <SectionHead
        title={t("robots")}
        caption={robots.length === 1 ? t("online_count", { count: robots.length }) : t("online_count", { count: robots.length })}
      />
      <div className="space-y-3">
        {robots.length === 0 ? (
          <p className="text-xs text-[#94A3B8] text-center py-4">{t("no_beds")}</p>
        ) : (
          robots.map((robot) => {
            const cfg = STATUS_CONFIG[robot.status] ?? STATUS_CONFIG.idle
            const batteryColor =
              robot.battery > 50 ? "text-normal-dark" : robot.battery > 20 ? "text-watch-dark" : "text-critical-dark"
            const statusText = lang === "ml" ? ML_STATUS_TEXT[cfg.labelKey] : t(cfg.labelKey)
            return (
              <div
                key={robot.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[#E6EBF2] hover:bg-[#F5F7FA] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF] focus-visible:ring-offset-2"
                role="button"
                tabIndex={0}
                aria-label={t("aria_robot", {
                  name: robot.name,
                  status: statusText,
                  battery: robot.battery,
                })}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${robot.status === "charging" ? "animate-pulse" : ""}`} aria-hidden="true" />
                <Icon name={cfg.icon} size={20} className={cfg.iconColor} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0F172A]">{robot.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cfg.pill} ${cfg.pillText}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">
                    ({robot.x.toFixed(1)}, {robot.y.toFixed(1)}) •{" "}
                    {robot.current_task_id != null
                      ? t("task_x", { id: robot.current_task_id })
                      : t("robot_unassigned")}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${batteryColor}`}>
                    <AnimatedNumber value={robot.battery} className="mr-1" />%
                  </div>
                  <div className="text-xs text-[#94A3B8] capitalize">
                    {t(`status_${robot.status}` as any) ?? robot.status}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
