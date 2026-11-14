import { Bed, LatestVital } from "../store/useStore"
import { t } from "../lib/i18n"
import { useNavigate } from "react-router-dom"
import { formatTime } from "../lib/format"
import { illnessForConditions, IllnessIcon } from "./IllnessArt"
import Card from "./Card"
import Icon from "./Icon"
import PatientAvatar from "./PatientAvatar"

type Status = "normal" | "watch" | "critical"

// Filled status pills: icon + colour + label, never colour alone.
const STATUS_CONFIG: Record<Status, { icon: string; textKey: string; badge: string }> = {
  normal: {
    icon: "circle-check",
    textKey: "status_normal",
    badge: "bg-lime text-navy",
  },
  watch: {
    icon: "alert-circle",
    textKey: "status_watch",
    badge: "bg-teal text-white text-base font-bold",
  },
  critical: {
    icon: "alert-triangle",
    textKey: "status_critical",
    badge: "bg-navy text-white text-base font-bold border-2 border-white animate-ring",
  },
}

// Card tint stays a palette tint — navy-tinted for critical, teal for watch.
const CARD_TINT: Record<Status, string> = {
  normal: "",
  watch: "border-teal/40 bg-watch-light/60",
  critical: "border-navy/40 bg-navy/[0.04]",
}

const DEFAULTS = {
  heart_rate: { min: 50, max: 120, critical_min: 40, critical_max: 140 },
  spo2: { min: 92, max: 100, critical_min: 90, critical_max: 100 },
  temperature: { min: 36, max: 38, critical_min: 35, critical_max: 39 },
}

const VITALS: Array<{
  type: "heart_rate" | "spo2" | "temperature"
  labelKey: string
  shortKey: string
  unit: string
  icon: string
}> = [
  { type: "heart_rate", labelKey: "heart_rate", shortKey: "heart_rate_short", unit: "bpm", icon: "heart-pulse" },
  { type: "spo2", labelKey: "spo2", shortKey: "spo2_short", unit: "%", icon: "wind" },
  { type: "temperature", labelKey: "temperature", shortKey: "temperature_short", unit: "°C", icon: "thermometer" },
]

function rangeState(type: string, value: number): "ok" | "watch" | "critical" {
  const thr = DEFAULTS[type as keyof typeof DEFAULTS]
  if (!thr) return "ok"
  if (type === "spo2") {
    if (value < thr.critical_min) return "critical"
    if (value < thr.min) return "watch"
    return "ok"
  }
  if (value < thr.critical_min || value > thr.critical_max) return "critical"
  if (value < thr.min || value > thr.max) return "watch"
  return "ok"
}

// Critical vitals out of range are the one place red is allowed besides the
// critical banner and E-STOP.
const VALUE_TONE: Record<string, string> = {
  ok: "text-navy",
  watch: "text-teal",
  critical: "text-alert",
}

export default function BedCard({ bed, index = 0 }: { bed: Bed; index?: number }) {
  const navigate = useNavigate()
  const status: Status = (bed.status as Status) ?? "normal"
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.normal
  const patient = bed.patient
  const readings: Record<string, LatestVital> = bed.latest_vitals ?? {}
  if (bed.latest_vital && !readings[bed.latest_vital.type]) {
    readings[bed.latest_vital.type] = bed.latest_vital
  }
  const conditions = (patient?.conditions ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)

  const handleOpen = () => {
    if (patient) navigate(`/patients/${patient.id}`)
  }

  return (
    <article
      className="h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleOpen()
        }
      }}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      aria-label={
        patient
          ? t("aria_bed_occupied", {
              label: bed.label,
              name: patient.name,
              status: t(cfg.textKey),
            })
          : t("aria_bed_empty", { label: bed.label, status: t(cfg.textKey) })
      }
    >
      <Card
        padded
        hoverable
        className={`flex h-full flex-col animate-fade ${CARD_TINT[status]}`}
      >
        <div className="flex items-start gap-3">
          {patient ? (
            <PatientAvatar name={patient.name} size={56} />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint/20 text-navy/60">
              <Icon name="bed" size={24} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {/* The name is the most prominent thing on the card: text-lg,
                bold, navy, no opacity, free to wrap to two lines. */}
            {/* Never truncates: the name wraps and the card grows if needed. */}
            <h3 className="break-words text-lg font-bold leading-snug text-navy">
              {patient ? patient.name : t("unoccupied")}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-medium text-navy/70">
              {patient && <span>{t("age_sex", { age: patient.age, sex: patient.sex })}</span>}
              <span className="rounded-full bg-teal/10 px-2 py-0.5 font-medium text-navy/70">
                {bed.label}
              </span>
            </div>
          </div>
          {patient && (
            <IllnessIcon kind={illnessForConditions(patient.conditions)} size={22} />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {conditions.slice(0, 2).map((condition) => (
              <span
                key={condition}
                className="rounded-full bg-brand-tint px-2 py-0.5 text-sm font-medium text-navy/70"
              >
                {condition}
              </span>
            ))}
          </div>
          {patient && (
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${cfg.badge}`}
            >
              <Icon name={cfg.icon as any} size={16} />
              {t(cfg.textKey)}
            </span>
          )}
        </div>

        <div className="mt-auto">
          {patient ? (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {VITALS.map((vital) => {
                const reading = readings[vital.type]
                const tone = reading ? rangeState(vital.type, reading.value) : "ok"
                return (
                  <div
                    key={vital.type}
                    className="rounded-xl border border-line bg-mint/[0.08] px-2 py-2"
                  >
                    <div
                      className="flex items-center gap-1 text-[10px] font-semibold text-navy/60"
                      title={t(vital.labelKey)}
                    >
                      <Icon name={vital.icon as any} size={16} />
                      <span className="truncate">{t(vital.shortKey)}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-0.5">
                      <span
                        className={`font-mono text-lg font-bold leading-none ${VALUE_TONE[tone]}`}
                      >
                        {reading ? reading.value.toFixed(vital.type === "temperature" ? 1 : 0) : "—"}
                      </span>
                      <span className="text-[10px] text-navy/60">{vital.unit}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-teal/25 py-5 text-center text-xs text-navy/60">
              {t("no_vitals_yet")}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-navy/60">
            <span>
              {bed.last_checked
                ? t("last_checked_at", { time: formatTime(bed.last_checked) })
                : "—"}
            </span>
            {patient && (
              <span className="font-bold text-teal">{t("view_details")} →</span>
            )}
          </div>
        </div>
      </Card>
    </article>
  )
}
