import { useEffect, useState } from "react"
import { useAppStore } from "../store/useStore"
import { fetchCarePlan, updateCarePlan } from "../lib/api"
import { t } from "../lib/i18n"

const DEFAULT_THRESHOLDS = {
  heart_rate: { min: 50, max: 120, critical_min: 40, critical_max: 140 },
  spo2: { min: 92, max: 100, critical_min: 90, critical_max: 100 },
  temperature: { min: 36.0, max: 38.0, critical_min: 35.0, critical_max: 39.0 },
}

export default function CarePlanEditor({ patientId }: { patientId: number }) {
  const { user, setPatient } = useAppStore()
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState("")
  const [thresholds, setThresholds] = useState<any>(DEFAULT_THRESHOLDS)

  const canEdit = user?.role === "doctor" || user?.role === "admin"

  useEffect(() => {
    loadPlan()
  }, [])

  async function loadPlan() {
    setLoading(true)
    try {
      const data = await fetchCarePlan(patientId)
      setPlan(data)
      setNotes(data.notes || "")
      setThresholds(data.thresholds || DEFAULT_THRESHOLDS)
    } catch (err) {
      console.error("Failed to load care plan", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const data = await updateCarePlan(patientId, { notes, thresholds })
      setPlan(data)
      setPatient(data)
    } catch (err) {
      console.error("Failed to save care plan", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 flex items-center justify-center h-48">
        <span className="text-sm text-gray-500">{t("loading_patient")}</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-base">{t("care_plan")}</h3>
        {!canEdit && (
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {t("doctor_only_edit")}
          </span>
        )}
      </div>

      {plan ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">{t("notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit}
              className={`w-full rounded-xl border p-3 text-sm ${!canEdit ? "bg-gray-50 text-gray-500" : "bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"}`}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              {t("thresholds")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {Object.entries(thresholds).map(([key, val]: [string, any]) => (
                <div
                  key={key}
                  className="p-3 rounded-xl border bg-gray-50"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {key}
                  </div>
                  <div className="text-gray-800 text-sm mb-1">
                    {val.min} &ndash; {val.max}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {t("critical_range", { min: val.critical_min, max: val.critical_max })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition-all"
            >
              {saving ? t("saving") : t("save_care_plan")}
            </button>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">{t("no_care_plan")}</p>
      )}
    </div>
  )
}
