import { useEffect, useState } from "react"
import { useAppStore } from "../store/useStore"
import { fetchAlerts, fetchTasks, fetchMedicationEvents } from "../lib/api"
import { t } from "../lib/i18n"
import { error } from "../lib/toast"

interface ShiftStats {
  criticalAlerts: number
  escalations: number
  missedMedicines: number
  tasksCompleted: number
  estopEvents: number
  patientsAffected: number
}

function ShiftHandover() {
  const { token } = useAppStore.getState()
  const [stats, setStats] = useState<ShiftStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [shiftDuration, setShiftDuration] = useState<"8h" | "12h" | "24h">("24h")

  useEffect(() => {
    async function loadStats() {
      try {
        const [alertsRes, tasksRes, medsRes] = await Promise.all([
          fetchAlerts({ token }),
          fetchTasks({ token }),
          fetchMedicationEvents({ token }),
        ])

        const now = new Date()
        let shiftStart: Date

        if (shiftDuration === "8h") {
          shiftStart = new Date(now.getTime() - 8 * 60 * 60 * 1000)
        } else if (shiftDuration === "12h") {
          shiftStart = new Date(now.getTime() - 12 * 60 * 60 * 1000)
        } else {
          shiftStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }

        // Critical alerts in shift
        const criticalAlerts = alertsRes?.filter(
          (a: any) => new Date(a.created_at) >= shiftStart && a.severity === "critical"
        ).length || 0

        // Escalations in shift
        const escalations = alertsRes?.filter(
          (a: any) => new Date(a.created_at) >= shiftStart && a.escalation_level > 0
        ).length || 0

        // Missed medicines in shift
        const missedMedicines = medsRes?.filter(
          (m: any) => new Date(m.due_at >= shiftStart || m.due_at) && m.status === "missed"
        ).length || 0

        // Tasks completed in shift
        const tasks = tasksRes?.filter(
          (t: any) => new Date(t.updated_at || t.created_at) >= shiftStart
        ) || []
        const tasksCompleted = tasks.filter((t: any) => t.status === "done").length

        // E-stop events in shift
        const estopEvents = alertsRes?.filter(
          (a: any) => new Date(a.created_at) >= shiftStart && a.type === "estop"
        ).length || 0

        // Patients affected (unique patient IDs)
        const patientsAffected = new Set(
          alertsRes?.filter(
            (a: any) => new Date(a.created_at) >= shiftStart && a.patient_id
          ).map((a: any) => a.patient_id)
        ).size || 0

        setStats({
          criticalAlerts,
          escalations,
          missedMedicines,
          tasksCompleted,
          estopEvents,
          patientsAffected,
        })
      } catch (e: any) {
        error(t("toast_error"), e?.message || "Failed to load handover stats")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [token, shiftDuration])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white rounded-2xl border border-[#E6EBF2] shadow-sm">
        <span className="animate-spin inline-block h-8 w-8 mr-3" />
        <span>{t("loading")}</span>
      </div>
    )
  }

  if (!stats) {
    return <div>{t("no_data_available")}</div>
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] p-6">
      <div className="bg-white rounded-2xl border border-[#E6EBF2] shadow-sm p-6">
        <h2 className="text-2xl font-bold text-[#0F172A] mb-6">
          {t("shift_handover_report")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="text-semibold text-[#374151] mb-3">
              {t("shift_duration")}
            </h3>
            <p className="text-3xl font-bold text-[#0F172A]">
              {shiftDuration.toUpperCase()}
            </p>
          </div>
          <div>
            <h3 className="text-semibold text-[#374151] mb-3">
              {t("critical_alerts")}
            </h3>
            <p className="text-3xl font-bold text-[#DC2626]">
              {stats.criticalAlerts}
            </p>
          </div>
          <div>
            <h3 className="text-semibold text-[#374151] mb-3">
              {t("estop_events")}
            </h3>
            <p className="text-3xl font-bold text-[#EF4444]">
              {stats.estopEvents}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-semibold text-[#374151] mb-3">
              {t("missed_medicines")}
            </h3>
            <p className="text-3xl font-bold text-[#DC2626]">
              {stats.missedMedicines}
            </p>
          </div>
          <div>
            <h3 className="text-semibold text-[#374151] mb-3">
              {t("tasks_completed")}
            </h3>
            <p className="text-3xl font-bold text-[#22C55E]">
              {stats.tasksCompleted}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-semibold text-[#374151] mb-3">
            {t("patients_affected")}
          </h3>
          <p className="text-lg text-[#374151]">
            {stats.patientsAffected}
          </p>
        </div>
      </div>

      {/* Shift duration selector */}
      <div className="mt-6 p-4 bg-white rounded-2xl border border-[#E6EBF2] shadow-sm">
        <h3 className="text-semibold text-[#374151] mb-4">
          {t("select_shift_duration")}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShiftDuration("8h")}
            className={`border rounded-md py-2 px-4 ${
              shiftDuration === "8h" ? "bg-[#0F172A] text-white" : "text-[#374151]"
            }`}
          >
            8h
          </button>
          <button
            onClick={() => setShiftDuration("12h")}
            className={`border rounded-md py-2 px-4 ${
              shiftDuration === "12h" ? "bg-[#0F172A] text-white" : "text-[#374151]"
            }`}
          >
            12h
          </button>
          <button
            onClick={() => setShiftDuration("24h")}
            className={`border rounded-md py-2 px-4 ${
              shiftDuration === "24h" ? "bg-[#0F172A] text-white" : "text-[#374151]"
            }`}
          >
            24h
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShiftHandover