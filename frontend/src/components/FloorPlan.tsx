import { Bed } from "../store/useStore"
import BedCard from "./BedCard"
import { t } from "../lib/i18n"

export default function FloorPlan({ beds }: { beds: Bed[] }) {
  if (beds.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center text-gray-600">
        <p className="text-lg">{t("no_beds")}</p>
      </div>
    )
  }

  const cols = 5
  const cellW = 160
  const cellH = 190
  const svgW = cellW * cols
  const svgH = cellH * 2

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-base">{t("ward_floor_plan")}</h3>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t("beds")}</span>
      </div>

      <div className="relative w-full aspect-[1.15] mb-4 overflow-hidden rounded border border-gray-100 bg-gray-50">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="max-w-full max-h-[300px] w-auto h-auto" role="img" aria-label={t("ward_floor_plan")}>
          {[...Array(cols)].map((_, c) => (
            <rect
              key={`col-${c}`}
              x={c * cellW}
              y={0}
              width={cellW - 10}
              height={cellH * 2 - 10}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          {beds.map((bed) => {
            const col = Math.floor((bed.x ?? 0) / 4)
            const row = Math.floor((bed.y ?? 0) / 4)
            const cx = col * cellW + cellW / 2
            const cy = row * cellH + cellH / 2
            return (
              <g key={bed.id} tabIndex={0} role="button" aria-label={t("bed_x", { id: bed.label })} className="cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r={26}
                  fill="#e5e7eb"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  className="focus:stroke-blue-500 focus:stroke-[3px]"
                />
                <text
                  x={cx}
                  y={cy + 6}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#374151"
                  pointerEvents="none"
                >
                  {bed.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {beds.map((bed) => (
          <BedCard key={bed.id} bed={bed} />
        ))}
      </div>
    </div>
  )
}
