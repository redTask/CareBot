import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAppStore } from "../store/useStore"
import { fetchPatient, apiRequest, fetchMedicationEvents } from "../lib/api"
import VitalsChart from "../components/VitalsChart"
import MedicationReminder from "../components/MedicationReminder"
import CarePlanEditor from "../components/CarePlanEditor"
import EStopButton from "../components/EStopButton"
import { t } from "../lib/i18n"

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const setPatient = useAppStore((state) => state.setPatient)
  const patients = useAppStore((state) => state.patients)
  const latestVitals = useAppStore((state) => state.latestVitals)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const id = patientId ? Number(patientId) : NaN
  const patient = patients[id]
  const [readings, setReadings] = useState<any[]>([])

  useEffect(() => {
    if (!id || isNaN(id)) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [patientData, vitalData, medEvents] = await Promise.all([
          fetchPatient(id),
          apiRequest(`/vitals?patient_id=${id}&limit=200`),
          fetchMedicationEvents({ patient_id: id }),
        ])
        if (mounted) {
          setPatient(patientData)
          setReadings(vitalData)
          setError("")
        }
      } catch (err: any) {
        if (mounted) setError(err.message || t("error"))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [id, setPatient])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">{t("loading_patient")}</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
        <div className="bg-white rounded-3xl shadow border border-red-200 p-8">
          <div className="w-12 h-12 rounded-full bg-[#FDE8E8] flex items-center justify-center text-[#DC2626] text-xl font-bold mx-auto mb-4">
            <Icon name="alert-circle" size={20} className="text-[#DC2626]" />
          </div>
          <h2 className="text-red-700 font-bold text-lg mb-2">{t("error")}</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700"
          >
            {t("back_to_dashboard_btn")}
          </button>
        </div>
      </div>
    )
  }
  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center text-gray-500 text-sm">
        {t("patient_not_found")}
      </div>
    )
  }

  const hrReadings = readings.filter((r) => r.type === "heart_rate")
  const spo2Readings = readings.filter((r) => r.type === "spo2")
  const tempReadings = readings.filter((r) => r.type === "temperature")

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F6BFF] hover:text-[#1F55D6]"
        >
          <Icon name="arrow-left" size={16} className="text-[#2F6BFF]" />
          {t("back_to_dashboard_btn")}
        </button>
      </nav>

      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{patient.name}</h1>
            <p className="text-gray-600 text-sm">
              {t("age_sex", { age: patient.age, sex: patient.sex })} •
              {patient.bed_id != null ? t("bed_x", { id: patient.bed_id }) : t("no_bed_assigned")}
            </p>
          </div>
        </div>
        <EStopButton />
        {patient.conditions && (
          <p className="mt-2 text-[10px] text-gray-500">{t("conditions_label")} {patient.conditions}</p>
        )}
        {latestVitals[id] && (
          <div className="mt-4 flex gap-4">
            {[
              { label: t("heart_rate"), type: "heart_rate" },
              { label: t("spo2"), type: "spo2" },
              { label: t("temperature"), type: "temperature" },
            ].map((item) => {
              const v = latestVitals[id]
              if (v.type !== item.type) return null
              return (
                <div
                  key={item.type}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-sm font-semibold"
                >
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-800">{v.value}</span>
                </div>
              )
            })}
          </div>
        )}
      </header>

      <section className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 text-base mb-4">{t("heart_rate_label")}</h3>
          <VitalsChart readings={hrReadings} vitalType="heart_rate" range="1h" />
        </div>
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 text-base mb-4">{t("spo2_label")}</h3>
          <VitalsChart readings={spo2Readings} vitalType="spo2" range="1h" />
        </div>
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 text-base mb-4">{t("temperature_label")}</h3>
          <VitalsChart readings={tempReadings} vitalType="temperature" range="1h" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <MedicationReminder patientId={patient.id} />
        </div>

        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
          <CarePlanEditor patientId={patient.id} />
        </div>
      </div>
    </div>
  )
}
