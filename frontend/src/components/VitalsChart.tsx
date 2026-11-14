import { useId } from "react"
import { VitalReading } from "../store/useStore"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { t } from "../lib/i18n"
import { formatTime } from "../lib/format"

// Charts are always teal line + mint gradient fill.
const TEAL = "#149DA5"
const MINT = "#51E4BA"

const SERIES: Record<string, { color: string; labelKey: string; unit: string }> = {
  heart_rate: { color: TEAL, labelKey: "heart_rate_label", unit: "bpm" },
  spo2: { color: TEAL, labelKey: "spo2_label", unit: "%" },
  temperature: { color: TEAL, labelKey: "temperature_label", unit: "°C" },
}

export default function VitalsChart({
  readings,
  vitalType,
  range,
}: {
  readings: VitalReading[]
  vitalType: string
  range: "1h" | "24h"
}) {
  const gradientId = `vital-grad-${useId().replace(/:/g, "")}`
  const series = SERIES[vitalType] ?? SERIES.heart_rate
  const cutoff = Date.now() - (range === "1h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000)

  const data = readings
    .filter(
      (reading) =>
        reading.type === vitalType && new Date(reading.timestamp).getTime() >= cutoff
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((reading) => ({
      time: formatTime(reading.timestamp),
      value: reading.value,
    }))

  if (data.length === 0) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-mint/[0.08] text-center">
        <span className="text-sm font-medium text-navy/60">{t("no_trend_data")}</span>
        <span className="mt-1 text-xs text-navy/40">
          {t(range === "1h" ? "range_1h" : "range_24h")}
        </span>
      </div>
    )
  }

  return (
    <div className="h-52 w-full" aria-label={t(series.labelKey)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MINT} stopOpacity={0.55} />
              <stop offset="100%" stopColor={MINT} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#149DA5"
            strokeOpacity={0.15}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "#254262" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#254262" }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(20, 157, 165, 0.25)",
              fontSize: 12,
              color: "#254262",
              background: "#ffffff",
            }}
            formatter={(value: number) => [`${value} ${series.unit}`, t(series.labelKey)]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={series.color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
