import { useEffect, useState } from "react"
import { useAppStore } from "../store/useStore"
import { fetchCarePlan, updateCarePlan } from "../lib/api"
import { t } from "../lib/i18n"
import Card from "./Card"
import SectionHead from "./SectionHead"
import Btn from "./Btn"

const DEFAULT_THRESHOLDS = {
  heart_rate: { min: 50, max: 120, critical_min: 40, critical_max: 140 },
  spo2: { min: 92, max: 100, critical_min: 90, critical_max: 100 },
  temperature: { min: 36.0, max: 38.0, critical_min: 35.0, critical_max: 39.0 },
}

export default function CarePlanEditor({ patientId }: { patientId: number }) {
  const { user } = useAppStore()
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
    } catch (err) {
      console.error("Failed to save care plan", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card hoverable={false} className="flex h-48 items-center justify-center">
        <span className="text-sm text-navy/60">{t("loading_patient")}</span>
      </Card>
    )
  }

  return (
    <Card hoverable={false}>
      <SectionHead
        title={t("care_plan")}
        caption={!canEdit ? t("doctor_only_edit") : undefined}
      />

      {plan ? (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-navy/70">{t("notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canEdit}
              className={`w-full rounded-xl border border-line p-3 text-sm outline-none transition-all duration-150 ${
                !canEdit
                  ? "bg-teal/10 text-navy/60"
                  : "bg-white text-navy focus:border-teal focus:ring-2 focus:ring-teal/25"
              }`}
              rows={3}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold text-navy/70">
              {t("thresholds")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {Object.entries(thresholds).map(([key, val]: [string, any]) => (
                <div
                  key={key}
                  className="rounded-xl border border-line bg-teal/10 p-3"
                >
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-navy/60">
                    {t(key as any) ?? key}
                  </div>
                  <div className="mb-1 text-sm font-semibold text-navy">
                    {val.min} – {val.max}
                  </div>
                  <div className="text-[10px] text-navy/60">
                    {t("critical_range", { min: val.critical_min, max: val.critical_max })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {canEdit && (
            <Btn onClick={handleSave} disabled={saving} className="w-full">
              {saving ? t("saving") : t("save_care_plan")}
            </Btn>
          )}
        </div>
      ) : (
        <p className="text-sm text-navy/60">{t("no_care_plan")}</p>
      )}
    </Card>
  )
}
