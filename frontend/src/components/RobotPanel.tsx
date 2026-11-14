import { Robot } from "../store/useStore"
import { t } from "../lib/i18n"
import Card from "./Card"
import SectionHead from "./SectionHead"

// Robot status pills: Idle mint, Busy teal, Charging light green, Stopped navy,
// Offline white with a navy border. Labels always accompany the colour.
const STATUS: Record<string, { pill: string; labelKey: string }> = {
  idle: { pill: "bg-mint text-navy", labelKey: "status_idle" },
  busy: { pill: "bg-teal text-white text-base font-bold", labelKey: "status_busy" },
  charging: { pill: "bg-lime text-navy", labelKey: "status_charging" },
  stopped: { pill: "bg-navy text-white", labelKey: "status_stopped" },
  offline: {
    pill: "bg-white text-navy border border-navy",
    labelKey: "status_offline",
  },
}

// Battery bars: mint fill on a teal-tinted track.
const BATTERY_FILL = "bg-mint"

export default function RobotPanel({ robots }: { robots: Robot[] }) {
  const active = robots.filter((robot) => robot.status !== "offline").length

  return (
    <Card>
      <SectionHead
        title={t("robots")}
        caption={t("online_count", { count: active })}
      />
      {robots.length === 0 ? (
        <p className="py-4 text-center text-xs text-navy/60">{t("no_beds")}</p>
      ) : (
        <div className="space-y-4">
          {robots.map((robot) => {
            const cfg = STATUS[robot.status] ?? STATUS.idle
            return (
              <div key={robot.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-navy">
                    {robot.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${cfg.pill}`}
                  >
                    {t(cfg.labelKey)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-teal/15">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${BATTERY_FILL}`}
                      style={{ width: `${Math.max(2, Math.min(100, robot.battery))}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs font-semibold text-navy/70">
                    {robot.battery}%
                  </span>
                </div>
                <div className="truncate text-xs text-navy/60">
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
