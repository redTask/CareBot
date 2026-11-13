import { Robot } from "../store/useStore"
import { t } from "../lib/i18n"
import Card from "./Card"
import SectionHead from "./SectionHead"

const STATUS: Record<string, { pill: string; labelKey: string }> = {
  idle: { pill: "bg-normal-light text-normal-dark", labelKey: "status_idle" },
  busy: { pill: "bg-brand-tint text-[#1F55D6]", labelKey: "status_busy" },
  charging: { pill: "bg-watch-light text-watch-dark", labelKey: "status_charging" },
  stopped: { pill: "bg-critical-light text-critical-dark", labelKey: "status_stopped" },
  offline: { pill: "bg-[#F1F4F9] text-[#64748B]", labelKey: "status_offline" },
}

function batteryTone(battery: number) {
  if (battery > 50) return "bg-normal-dark"
  if (battery > 20) return "bg-watch-dark"
  return "bg-critical-dark"
}

export default function RobotPanel({ robots }: { robots: Robot[] }) {
  const active = robots.filter((robot) => robot.status !== "offline").length

  return (
    <Card>
      <SectionHead
        title={t("robots")}
        caption={t("online_count", { count: active })}
      />
      {robots.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#94A3B8]">{t("no_beds")}</p>
      ) : (
        <div className="space-y-4">
          {robots.map((robot) => {
            const cfg = STATUS[robot.status] ?? STATUS.idle
            return (
              <div key={robot.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[#0F172A]">
                    {robot.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.pill}`}
                  >
                    {t(cfg.labelKey)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F1F4F9]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${batteryTone(robot.battery)}`}
                      style={{ width: `${Math.max(2, Math.min(100, robot.battery))}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs font-semibold text-[#475569]">
                    {robot.battery}%
                  </span>
                </div>
                <div className="truncate text-xs text-[#94A3B8]">
                  {t("current_task")}:{" "}
                  {robot.current_task_id != null
                    ? t("task_x", { id: robot.current_task_id })
                    : t("no_task")}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
