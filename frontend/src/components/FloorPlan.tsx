import { Bed } from "../store/useStore"
import BedCard from "./BedCard"
import { t } from "../lib/i18n"
import SectionHead from "./SectionHead"
import Card from "./Card"
import Illustration from "./Illustration"

export default function FloorPlan({ beds }: { beds: Bed[] }) {
  if (beds.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center text-center py-10">
          <Illustration className="w-72 mx-auto mb-6" />
          <h3 className="text-lg font-semibold font-heading text-[#0F172A]">{t("no_beds")}</h3>
        </div>
      </Card>
    )
  }

  const cols = 5
  const cellW = 160
  const cellH = 190
  const svgW = cellW * cols
  const svgH = cellH * 2

  return (
    <Card>
      <SectionHead title={t("ward_floor_plan")} caption={t("beds")} />
      <div className="relative w-full overflow-hidden rounded-xl border border-[#E6EBF2] bg-[#F1F4F9] mb-6">
        <svg
          width="100%"
          height="auto"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ maxHeight: 340 }}
          role="img"
          aria-label={t("ward_floor_plan")}
          preserveAspectRatio="xMidYMid meet"
        >
          {[...Array(cols)].map((_, c) => (
            <rect
              key={`col-${c}`}
              x={c * cellW}
              y={0}
              width={cellW - 10}
              height={cellH * 2 - 10}
              fill="none"
              stroke="#E6EBF2"
              strokeWidth="1"
            />
          ))}
          {beds.map((bed) => {
            const col = Math.floor((bed.x ?? 0) / 4)
            const row = Math.floor((bed.y ?? 0) / 4)
            const cx = col * cellW + cellW / 2
            const cy = row * cellH + cellH / 2
            return (
              <g
                key={bed.id}
                tabIndex={0}
                role="button"
                aria-label={t("bed_x", { id: bed.label })}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={26}
                  fill="#F1F4F9"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  className="focus:stroke-[#2F6BFF] focus:stroke-[3px] transition-colors duration-150"
                />
                <text
                  x={cx}
                  y={cy + 6}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#374151"
                  pointerEvents="none"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {bed.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {beds.map((bed) => (
          <BedCard key={bed.id} bed={bed} />
        ))}
      </div>
    </Card>
  )
}


