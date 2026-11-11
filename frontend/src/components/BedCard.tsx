import { Bed } from "../store/useStore"
import { getLang, t } from "../lib/i18n"
import Icon from "./Icon"

type Status = "normal" | "watch" | "critical"

const STATUS_CONFIG: Record<string, { color: string; bg: string; textKey: string; icon: string }> = {
  normal: {
    color: "text-green-600",
    bg: "bg-green-100",
    textKey: "status_normal",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`,
  },
  watch: {
    color: "text-amber-600",
    bg: "bg-amber-100",
    textKey: "status_watch",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
  },
  critical: {
    color: "text-red-600",
    bg: "bg-red-100",
    textKey: "status_critical",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`,
  },
}

const ML_STATUS_TEXT: Record<string, string> = {
  status_normal: "സാധാരണ",
  status_watch: "സൂക്ഷിക്കുക",
  status_critical: "ക്രിട്ടിക്കൽ",
}

export default function BedCard({ bed }: { bed: Bed }) {
  const lang = getLang()
  const status: Status = (bed.status as Status) ?? "normal"
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.normal
  const patient = bed.patient
  const vital = bed.latest_vital

  const statusText =
    lang === "ml" ? ML_STATUS_TEXT[cfg.textKey] : t(cfg.textKey)

  const vitalNodes = vital
    ? [
        { label: "HR", type: "heart_rate" },
        { label: "SpO₂", type: "spo2" },
        { label: "Temp", type: "temperature" },
      ]
        .filter((v) => vital.type === v.type)
        .map((v) => (
          <span key={v.label} className="text-xl font-mono font-bold">
            {v.label} {vital.value}
          </span>
        ))
    : null

  return (
    <article
      className="relative bg-white rounded-xl border p-3 shadow-sm min-w-[170px] max-w-[190px]"
      role="button"
      tabIndex={0}
      aria-label={`Bed ${bed.label}, patient ${patient?.name ?? "unoccupied"}, status ${statusText}`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="font-bold text-gray-800 text-sm">{bed.label}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg} px-2.5 py-0.5 rounded`}>
          {statusText}
        </span>
      </div>
      {patient && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-700 leading-tight">{patient.name}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {patient.age}y &bull; {patient.sex}
          </div>
          {patient.conditions && (
            <div className="text-xs text-gray-400 mt-1 italic">{patient.conditions}</div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-3 h-3 rounded-full border border-gray-200 ${status === "normal" ? "bg-green-500" : status === "watch" ? "bg-amber-500" : "bg-red-500"}`}
          aria-label={statusText}
        />
        <Icon size="sm" className={`text-${cfg.color.replace("text-", "")}`} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cfg.icon} />
        </Icon>
        <span className={`text-xs font-medium ${cfg.color}`}>{statusText}</span>
      </div>
      {vitalNodes ? (
        <div className="text-sm text-gray-600 space-y-1">{vitalNodes}</div>
      ) : (
        <div className="text-sm text-gray-400 italic">No vitals yet</div>
      )}
      <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">
        {bed.last_checked ? `Last checked ${new Date(bed.last_checked).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "—"}
      </div>
    </article>
  )
}
