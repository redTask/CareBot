import { Bed } from "../store/useStore"
import { getLang, t } from "../lib/i18n"
import { useNavigate } from "react-router-dom"
import Card from "./Card"
import StatusChip from "./StatusChip"
import StatusRow from "./StatusRow"

type Status = "normal" | "watch" | "critical"

const STATUS_CONFIG: Record<string, {
  variant: Status;
  icon: string;
  textKey: string;
}> = {
  normal: { variant: "normal", icon: "circle-check", textKey: "status_normal" },
  watch: { variant: "watch", icon: "alert-circle", textKey: "status_watch" },
  critical: { variant: "critical", icon: "alert-triangle", textKey: "status_critical" },
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

  const vitalNode = vital ? (
    <span className="text-sm font-mono font-bold text-[#0F172A]">
      {vital.type === "heart_rate" ? t("heart_rate") : vital.type === "spo2" ? t("spo2") : t("temperature")}
      {" "}
      {vital.value}
    </span>
  ) : null

  return (
    <article
      className={[
        "relative min-w-[170px] cursor-pointer focus:outline-none",
        status === "critical" ? "animate-ring shadow-[0_0_0_0_rgba(220,38,38,0.4)]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
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
      <Card padded hoverable>
        <div className="flex justify-between items-start">
          <span className="text-sm font-semibold text-[#0F172A]">{bed.label}</span>
          <StatusChip variant={cfg.variant} labelKey={cfg.textKey} />
        </div>

        {patient && (
          <div className="mt-4">
            <div className="text-sm font-semibold text-[#0F172A] leading-tight">
              {patient.name}
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">
              {t("age_sex", { age: patient.age, sex: patient.sex })}
            </div>
            {patient.conditions && (
              <div className="text-xs text-[#94A3B8] mt-1 italic">{patient.conditions}</div>
            )}
          </div>
        )}
        {!patient && (
          <div className="mt-6 text-center">
            <p className="text-xs text-[#94A3B8] italic">{t("unoccupied")}</p>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <StatusRow variant={cfg.variant} labelKey={cfg.textKey} />
        </div>

        {vitalNode ? (
          <div className="mt-3">{vitalNode}</div>
        ) : (
          <div className="mt-3 text-xs text-[#94A3B8] italic">{t("no_vitals_yet")}</div>
        )}

        <div className="mt-4 text-xs text-[#94A3B8]">
          {bed.last_checked
            ? t("last_checked_x", {
                time: new Date(bed.last_checked).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })
            : "—"}
        </div>
      </Card>
    </article>
  )
}
