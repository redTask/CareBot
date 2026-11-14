import { useEffect, useState } from "react"
import { fetchAlerts, fetchTasks, fetchMedicationEvents } from "../lib/api"
import { t } from "../lib/i18n"
import { error } from "../lib/toast"
import Icon from "../components/Icon"

interface ShiftStats {
  criticalAlerts: number
  escalations: number
  missedMedicines: number
  tasksCompleted: number
  estopEvents: number
  patientsAffected: number
}

function StatBlock({
  icon,
  label,
  value,
  tone = "text-navy",
}: {
  icon: string
  label: string
  value: number | string
  tone?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-navy/70">
        <Icon name={icon as any} size={16} />
        <h3 className="text-sm font-semibold text-navy/70">{label}</h3>
      </div>
      <p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function ShiftHandover() {
  const [stats, setStats] = useState<ShiftStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [shiftDuration, setShiftDuration] = useState<"8h" | "12h" | "24h">("24h")

  useEffect(() => {
    async function loadStats() {
      try {
        const [alertsRes, tasksRes, medsRes] = await Promise.all([
          fetchAlerts(),
          fetchTasks(),
          fetchMedicationEvents(),
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
  }, [shiftDuration])

  return (
    <div className="min-h-screen page-bg p-6">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal text-white">
            <Icon name="file-text" size={24} />
          </span>
          <h2 className="text-2xl font-bold text-navy">
            {t("shift_handover_report")}
          </h2>
        </div>

        {loading || !stats ? (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-mint/[0.08] px-4 py-6">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            <span className="text-sm font-semibold text-navy/70">{t("loading")}</span>
          </div>
        ) : (
        <>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatBlock
            icon="clock"
            label={t("shift_duration")}
            value={shiftDuration.toUpperCase()}
            tone="text-teal"
          />
          <StatBlock
            icon="alert-triangle"
            label={t("critical_alerts")}
            value={stats.criticalAlerts}
          />
          <StatBlock icon="power" label={t("estop_events")} value={stats.estopEvents} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <StatBlock
            icon="pill"
            label={t("missed_medicines")}
            value={stats.missedMedicines}
          />
          <StatBlock
            icon="circle-check"
            label={t("tasks_completed")}
            value={stats.tasksCompleted}
            tone="text-teal"
          />
        </div>

        <div className="mt-4 rounded-xl border border-line bg-mint/15 p-4">
          <h3 className="text-sm font-semibold text-navy/70">
            {t("patients_affected")}
          </h3>
          <p className="mt-1 text-lg font-bold text-navy">{stats.patientsAffected}</p>
        </div>
        </>
        )}
      </div>

      {/* Shift duration selector */}
      <div className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-card">
        <h3 className="mb-4 text-sm font-semibold text-navy/70">
          {t("select_shift_duration")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {(["8h", "12h", "24h"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setShiftDuration(value)}
              aria-pressed={shiftDuration === value}
              className={`min-h-[40px] rounded-xl border px-4 text-base font-bold transition-colors ${
                shiftDuration === value
                  ? "border-teal bg-teal text-white"
                  : "border-line bg-white text-navy hover:bg-brand-tint"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ShiftHandover
