import { Bed } from "../store/useStore"
import { getLang, t } from "../lib/i18n"
import Icon from "./Icon"
import { useNavigate } from "react-router-dom"

type Status = "normal" | "watch" | "critical"

const STATUS_CONFIG: Record<string, {
  color: string;      // dot / severity text color
  badge: string;      // badge text on -100 background
  text: string;       // status span color
  bg: string;
  textKey: string;
  icon: string;
}> = {
  normal: {
    color: "text-green-600",
    badge: "text-green-900",
    text: "text-green-800",
    bg: "bg-green-100",
    textKey: "status_normal",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`,
  },
  watch: {
    color: "text-amber-600",
    badge: "text-amber-900",
    text: "text-amber-800",
    bg: "bg-amber-100",
    textKey: "status_watch",
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`,
  },
  critical: {
    color: "text-red-600",
    badge: "text-red-900",
    text: "text-red-800",
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
  const navigate = useNavigate()
  const status: Status = (bed.status as Status) ?? "normal"
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.normal
  const patient = bed.patient
  const vital = bed.latest_vital

  const statusText =
    lang === "ml" ? ML_STATUS_TEXT[cfg.textKey] : t(cfg.textKey)

  const handleClick = () => {
    if (patient) navigate(`/patients/${patient.id}`)
  }

  const vitalNodes = vital
    ? [
        { label: t("heart_rate"), type: "heart_rate" },
        { label: t("spo2"), type: "spo2" },
        { label: t("temperature"), type: "temperature" },
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
      className={`relative bg-white rounded-xl border p-3 shadow-sm min-w-[170px] max-w-[190px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        patient ? "" : "opacity-50"
      }`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      aria-label={
        patient
          ? t("aria_bed_occupied", {
              label: bed.label,
              name: patient.name,
              status: statusText,
            })
          : t("aria_bed_empty", { label: bed.label, status: statusText })
      }
    >
      <div className="flex justify-between items-start mb-3">
        <span className="font-bold text-gray-800 text-sm">{bed.label}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.badge} ${cfg.bg} px-2.5 py-0.5 rounded`}>
          {statusText}
        </span>
      </div>
      {patient && (
        <div className="mb-3">
          <div className="text-sm font-semibold text-gray-700 leading-tight">{patient.name}</div>
          <div className="text-sm text-gray-500 mt-0.5">
            {t("age_sex", { age: patient.age, sex: patient.sex })}
          </div>
          {patient.conditions && (
            <div className="text-xs text-gray-500 mt-1 italic">{patient.conditions}</div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-3 h-3 rounded-full border border-gray-200 ${status === "normal" ? "bg-green-600" : status === "watch" ? "bg-amber-600" : "bg-red-600"}`}
          aria-hidden="true"
        />
        <Icon size="sm" className={`text-${cfg.color.replace("text-", "")}`} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cfg.icon} />
        </Icon>
        <span className={`text-xs font-medium ${cfg.text}`}>{statusText}</span>
      </div>
      {vitalNodes ? (
        <div className="text-sm text-gray-600 space-y-1">{vitalNodes}</div>
      ) : (
        <div className="text-sm text-gray-500 italic">{t("no_vitals_yet")}</div>
      )}
      <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-50">
        {bed.last_checked
          ? t("last_checked_x", {
              time: new Date(bed.last_checked).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            })
          : "—"}
      </div>
    </article>
  )
}
