import { VitalReading } from "../store/useStore"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { t } from "../lib/i18n"

const SERIES_COLOR: Record<string, string> = {
  heart_rate: "#ef4444",
  spo2: "#3b82f6",
  temperature: "#10b981",
}

interface VitalsChartProps {
  readings: VitalReading[]
  vitalType: string
  range: "1h" | "24h"
}

export default function VitalsChart({ readings, vitalType, range }: VitalsChartProps) {
  const filtered = readings
    .filter((r) => r.type === vitalType)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const data = filtered.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: r.value,
  }))

  const labelMap: Record<string, string> = {
    heart_rate: t("heart_rate_label"),
    spo2: t("spo2_label"),
    temperature: t("temperature_label"),
  }

  if (data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-gray-200 text-gray-400">
        <span className="text-sm">{t("no_readings", { label: labelMap[vitalType] })}</span>
      </div>
    )
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={SERIES_COLOR[vitalType]}
            strokeWidth={2}
            dot={{ fill: SERIES_COLOR[vitalType], strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-xs text-gray-500 mt-3 flex items-center justify-between">
        <span>{labelMap[vitalType]}</span>
        <span>{t("range_1h")}</span>
      </div>
    </div>
  )
}
