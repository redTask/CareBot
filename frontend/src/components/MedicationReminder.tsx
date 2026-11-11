import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { fetchMedicationEvents, acknowledgeMedicationEvent, markMedicationEventMissed } from "../lib/api"
import { getLang, t } from "../lib/i18n"

export default function MedicationReminder({ patientId }: { patientId: number }) {
  const { medicationEvents, updateMedicationEvent, user } = useAppStore()
  const [loading, setLoading] = useState(false)

  const patientEvents = medicationEvents.filter(
    (e) => e.patient_id === patientId
  )

  const handleAck = async (id: number) => {
    setLoading(true)
    try {
      await acknowledgeMedicationEvent(id, user?.id ?? 0)
      updateMedicationEvent({ id, status: "acknowledged" })
    } catch (err) {
      console.error("Failed to acknowledge medication", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMiss = async (id: number) => {
    setLoading(true)
    try {
      await markMedicationEventMissed(id)
      updateMedicationEvent({ id, status: "missed" })
    } catch (err) {
      console.error("Failed to mark medication missed", err)
    } finally {
      setLoading(false)
    }
  }

  if (patientEvents.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 text-base mb-4">{t("medication_schedule")}</h3>
        <p className="text-sm text-gray-500">{t("no_medications")}</p>
      </div>
    )
  }

  const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    pending: { color: "text-amber-700", bg: "bg-amber-100" },
    acknowledged: { color: "text-green-700", bg: "bg-green-100" },
    missed: { color: "text-red-700", bg: "bg-red-100" },
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
      <h3 className="font-bold text-gray-800 text-base mb-4">{t("medication_schedule")}</h3>
      <div className="space-y-3">
        {patientEvents.map((e) => {
          const cfg = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.pending
          const isPending = e.status === "pending"
          const borderClass =
            e.status === "pending"
              ? "border-amber-200"
              : e.status === "acknowledged"
                ? "border-green-200"
                : "border-red-200"
          return (
            <div
              key={e.id}
              className={`flex items-center justify-between p-3 rounded-xl border bg-white ${borderClass}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                    {e.status}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800">
                    {e.drug} {e.dose}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Due {new Date(e.due_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isPending && (
                  <>
                    <button
                      onClick={() => handleAck(e.id)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-60"
                    >
                      {t("acknowledge_med")}
                    </button>
                    <button
                      onClick={() => handleMiss(e.id)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-60"
                    >
                      {t("mark_missed")}
                    </button>
                  </>
                )}
                {!isPending && (
                  <span className={`text-[10px] font-semibold ${cfg.color}`}>
                    {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
