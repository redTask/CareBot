import { useState } from "react"
import { Bed, Robot } from "../store/useStore"
import { t } from "../lib/i18n"
import Card from "./Card"
import Icon from "./Icon"

const STATUS_CELL: Record<string, string> = {
  normal: "border-lime bg-lime/60 text-navy",
  watch: "border-teal bg-watch-light text-navy",
  critical: "border-2 border-navy bg-navy/[0.08] text-navy font-bold",
}

const LEGEND = [
  { key: "status_normal", dot: "bg-lime" },
  { key: "status_watch", dot: "bg-teal" },
  { key: "status_critical", dot: "bg-navy" },
]

export default function FloorPlan({
  beds,
  robots = [],
}: {
  beds: Bed[]
  robots?: Robot[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <Card padded={false} hoverable={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h3 className="text-lg font-semibold font-heading text-navy">
            {t("ward_floor_plan")}
          </h3>
          <p className="mt-0.5 text-xs text-navy/60">
            {beds.length} beds • 2 rows × 5 cols
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-navy/70 transition-colors hover:bg-teal/10"
        >
          <Icon name={open ? "chevron-up" : "chevron-down"} size={16} />
          {open ? t("floor_plan_hide") : t("floor_plan_show")}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-mint/[0.08] p-4 sm:p-5">
          {beds.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy/60">{t("no_beds")}</p>
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {beds.map((bed) => {
                const robotsHere = robots.filter(
                  (robot) =>
                    Math.abs(robot.x - bed.x) < 2 && Math.abs(robot.y - bed.y) < 2
                )
                return (
                  <div
                    key={bed.id}
                    className={[
                      "relative flex min-h-[64px] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center",
                      STATUS_CELL[bed.status] ?? STATUS_CELL.normal,
                    ].join(" ")}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide sm:text-xs">
                      {bed.label}
                    </span>
                    <span className="mt-0.5 max-w-full truncate text-[10px] font-semibold text-navy/70">
                      {bed.patient ? bed.patient.name.split(" ")[0] : t("unoccupied")}
                    </span>
                    {robotsHere.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-white shadow-sm">
                        <Icon name="robot" size={16} className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-semibold text-navy/70">
            {LEGEND.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${item.dot}`} aria-hidden="true" />
                {t(item.key)}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal text-white">
                <Icon name="robot" size={16} className="w-2.5 h-2.5" />
              </span>
              {t("robots")}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
