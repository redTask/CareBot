import { useState } from "react"
import { MedicationEvent } from "../store/useStore"
import { acknowledgeMedicationEvent, markMedicationEventMissed } from "../lib/api"
import { t } from "../lib/i18n"
import { formatTime } from "../lib/format"
import Card from "./Card"
import SectionHead from "./SectionHead"
import EmptyState from "./EmptyState"

export interface PatientMedication {
  id: number
  drug: string
  dose: string
  schedule_times: string[]
}

const STATUS: Record<string, { pill: string; labelKey: string }> = {
  pending: { pill: "bg-watch-light text-watch-dark", labelKey: "status_pending" },
  acknowledged: {
    pill: "bg-normal-light text-normal-dark",
    labelKey: "status_acknowledged",
  },
  missed: { pill: "bg-critical-light text-critical-dark", labelKey: "status_missed" },
}

export default function MedicationReminder({
  patientId,
  medications = [],
  events,
  onChanged,
}: {
  patientId: number
  medications?: PatientMedication[]
  events: MedicationEvent[]
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)

  const patientEvents = events.filter((event) => event.patient_id === patientId)
  const nextEventFor = (medicationId: number) =>
    patientEvents
      .filter((event) => event.medication_id === medicationId)
      .sort((a, b) => new Date(b.due_at ?? 0).getTime() - new Date(a.due_at ?? 0).getTime())[0]

  const act = async (eventId: number, action: "ack" | "miss") => {
    setBusy(true)
    try {
      if (action === "ack") {
        await acknowledgeMedicationEvent(eventId, 0)
      } else {
        await markMedicationEventMissed(eventId)
      }
      onChanged()
    } catch (err) {
      console.error("Medication action failed", err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card hoverable={false}>
      <SectionHead title={t("medication_schedule")} />
      {medications.length === 0 && patientEvents.length === 0 ? (
        <EmptyState icon="pill" title={t("no_medications_scheduled")} />
      ) : (
        <div className="space-y-3">
          {medications.map((medication) => {
            const event = nextEventFor(medication.id)
            const status = event?.status ?? "scheduled"
            const cfg = STATUS[status]
            return (
              <div
                key={medication.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6EBF2] p-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[#0F172A]">
                      {medication.drug} {medication.dose}
                    </span>
                    {cfg && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.pill}`}
                      >
                        {t(cfg.labelKey)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[#94A3B8]">
                    {medication.schedule_times.join(" · ")}
                    {event?.due_at && ` • ${t("due_x", { time: formatTime(event.due_at) })}`}
                  </div>
                </div>
                {event?.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(event.id, "ack")}
                      className="min-h-[40px] rounded-xl border border-[#BBF7D0] bg-normal-light px-3 text-xs font-semibold text-normal-dark transition-colors hover:bg-[#D7F2E1] disabled:opacity-60"
                    >
                      {t("acknowledge_med")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(event.id, "miss")}
                      className="min-h-[40px] rounded-xl border border-[#FECACA] bg-critical-light px-3 text-xs font-semibold text-critical-dark transition-colors hover:bg-[#FBD5D5] disabled:opacity-60"
                    >
                      {t("mark_missed")}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-[#94A3B8]">
                    {status === "acknowledged"
                      ? t("status_acknowledged")
                      : status === "missed"
                        ? t("status_missed")
                        : t("status_scheduled")}
                  </span>
                )}
              </div>
            )
          })}

          {patientEvents.length === 0 && (
            <p className="text-xs text-[#94A3B8]">{t("no_medication_events")}</p>
          )}
        </div>
      )}
    </Card>
  )
}
