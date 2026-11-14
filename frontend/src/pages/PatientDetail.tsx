import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAppStore, MedicationEvent, VitalReading, Alert } from "../store/useStore"
import {
  fetchPatient,
  fetchVitals,
  fetchMedicationEvents,
  fetchAlerts,
} from "../lib/api"
import VitalsChart from "../components/VitalsChart"
import MedicationReminder, {
  PatientMedication,
} from "../components/MedicationReminder"
import CarePlanEditor from "../components/CarePlanEditor"
import AppHeader from "../components/AppHeader"
import Icon from "../components/Icon"
import Page from "../components/Page"
import Card from "../components/Card"
import SectionHead from "../components/SectionHead"
import PatientAvatar from "../components/PatientAvatar"
import EmptyState from "../components/EmptyState"
import { ChartSkeleton } from "../components/Skeleton"
import { IllnessArt, illnessForConditions, IllnessKey } from "../components/IllnessArt"
import { t } from "../lib/i18n"
import { formatDateTime } from "../lib/format"

type Tab = "overview" | "vitals" | "medication" | "history"

const VITAL_TILES = [
  { type: "heart_rate", labelKey: "heart_rate", unit: "bpm", icon: "heart-pulse" },
  { type: "spo2", labelKey: "spo2", unit: "%", icon: "wind" },
  { type: "temperature", labelKey: "temperature", unit: "°C", icon: "thermometer" },
] as const

const ORGAN_KEY: Record<IllnessKey, string> = {
  heart: "organ_heart",
  lungs: "organ_lungs",
  diabetes: "organ_diabetes",
  brain: "organ_brain",
  kidney: "organ_kidney",
  default: "organ_general",
}

const SEVERITY_TONE: Record<string, string> = {
  critical: "bg-navy text-white",
  watch: "bg-teal text-white",
  info: "bg-brand-tint text-navy",
}

function nextMedicine(medications: PatientMedication[]): string | null {
  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  let best: { minutes: number; label: string } | null = null
  for (const medication of medications) {
    for (const time of medication.schedule_times ?? []) {
      const [hour, minute] = time.split(":").map(Number)
      if (Number.isNaN(hour) || Number.isNaN(minute)) continue
      const minutes = hour * 60 + minute
      if (minutes >= minutesNow && (!best || minutes < best.minutes)) {
        best = { minutes, label: time }
      }
    }
  }
  return best?.label ?? null
}

export default function PatientDetail() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const setPatient = useAppStore((state) => state.setPatient)
  const patients = useAppStore((state) => state.patients)
  const storeVitals = useAppStore((state) => state.latestVitals)

  const id = patientId ? Number(patientId) : NaN
  const patient = Number.isNaN(id) ? undefined : patients[id]

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [tab, setTab] = useState<Tab>("overview")
  const [range, setRange] = useState<"1h" | "24h">("1h")
  const [vitalType, setVitalType] = useState<string>("heart_rate")
  const [readings, setReadings] = useState<VitalReading[]>([])
  const [eventRows, setEventRows] = useState<MedicationEvent[]>([])
  const [patientAlerts, setPatientAlerts] = useState<Alert[]>([])
  const [vitalsLoading, setVitalsLoading] = useState(true)

  useEffect(() => {
    if (!id || Number.isNaN(id)) return
    let mounted = true
    ;(async () => {
      try {
        const [patientData, events, alerts] = await Promise.all([
          fetchPatient(id),
          fetchMedicationEvents({ patient_id: id }),
          fetchAlerts({ patient_id: id }),
        ])
        if (!mounted) return
        setPatient(patientData)
        setEventRows(events)
        setPatientAlerts(alerts)
        setError("")
      } catch (err: any) {
        if (mounted) setError(err.message || t("error"))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [id, setPatient])

  const loadVitals = useCallback(
    async (targetRange: "1h" | "24h") => {
      if (!id || Number.isNaN(id)) return
      setVitalsLoading(true)
      try {
        setReadings(await fetchVitals(id, targetRange, 400))
      } catch (err) {
        console.error("Failed to load vitals", err)
      } finally {
        setVitalsLoading(false)
      }
    },
    [id]
  )

  useEffect(() => {
    loadVitals(range)
  }, [range, loadVitals])

  const reloadEvents = useCallback(async () => {
    if (!id) return
    try {
      setEventRows(await fetchMedicationEvents({ patient_id: id }))
    } catch (err) {
      console.error("Failed to reload medication events", err)
    }
  }, [id])

  const latestByType = useMemo(() => {
    const map: Record<string, VitalReading> = {}
    for (const reading of readings) {
      if (!map[reading.type]) map[reading.type] = reading
    }
    return map
  }, [readings])

  if (loading) {
    return (
      <Page>
        <AppHeader active="dashboard" />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-40 rounded bg-line" />
            <div className="h-56 rounded-2xl bg-white" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 rounded-2xl bg-white" />
              <div className="h-32 rounded-2xl bg-white" />
              <div className="h-32 rounded-2xl bg-white" />
            </div>
          </div>
        </main>
      </Page>
    )
  }

  if (error || !patient) {
    return (
      <Page>
        <AppHeader active="dashboard" />
        <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4">
          <Card hoverable={false} className="w-full max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-navy">
              <Icon name="alert-circle" size={20} />
            </div>
            <h2 className="mb-2 text-lg font-bold text-navy">{t("error")}</h2>
            <p className="mb-6 text-sm text-navy/70">{error || t("patient_not_found")}</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="min-h-[44px] w-full rounded-xl bg-teal px-4 text-base font-bold text-white transition-colors hover:bg-navy"
            >
              {t("back_to_dashboard_btn")}
            </button>
          </Card>
        </main>
      </Page>
    )
  }

  const conditions = (patient.conditions ?? "")
    .split(",")
    .map((condition) => condition.trim())
    .filter(Boolean)
  const illness = illnessForConditions(patient.conditions)
  const organKey = ORGAN_KEY[illness]
  const medications: PatientMedication[] = patient.medications ?? []
  const next = nextMedicine(medications)

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "overview", label: t("tab_overview") },
    { key: "vitals", label: t("tab_vitals") },
    { key: "medication", label: t("tab_medication") },
    { key: "history", label: t("tab_history") },
  ]

  return (
    <Page>
      <AppHeader active="dashboard" />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mb-4 inline-flex min-h-[40px] items-center gap-2 rounded-xl px-2 text-sm font-bold text-teal transition-colors hover:bg-brand-tint"
        >
          <Icon name="arrow-left" size={16} />
          {t("back_to_dashboard_btn")}
        </button>

        <Card hoverable={false} className="mb-5 overflow-hidden">
          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <PatientAvatar name={patient.name} size={64} />
                <div className="min-w-0">
                  {/* The patient name leads the detail page: text-2xl, bold,
                      navy, no truncation or opacity. */}
                  <h1 className="break-words font-heading text-2xl font-bold leading-tight text-navy">
                    {patient.name}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-navy/70">
                    {t("age_sex", { age: patient.age, sex: patient.sex })} •{" "}
                    {patient.bed_id != null
                      ? t("bed_x", { id: patient.bed_id })
                      : t("no_bed_assigned")}
                  </p>
                </div>
              </div>

              {conditions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {conditions.map((condition) => (
                    <span
                      key={condition}
                      className="rounded-full bg-brand-tint px-2.5 py-1 text-sm font-medium text-navy/70"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="mt-6 max-w-md font-heading text-xl font-semibold leading-snug text-navy sm:text-2xl">
                {t("general_indicators", { organ: t(organKey) })}
              </h2>
            </div>

            <div className="mx-auto w-full max-w-[260px]">
              <div className="flex aspect-square items-center justify-center rounded-full bg-brand-tint p-7 ring-1 ring-teal/30">
                <IllnessArt kind={illness} className="max-w-[190px]" />
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              aria-pressed={tab === item.key}
              className={[
                "min-h-[40px] rounded-lg px-4 text-sm font-semibold transition-colors",
                tab === item.key
                  ? "bg-brand-tint text-teal"
                  : "text-navy/70 hover:bg-teal/10",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {VITAL_TILES.map((tile) => {
                const reading = latestByType[tile.type] ?? storeVitals[patient.id]
                return (
                  <Card key={tile.type} hoverable={false} className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                      <Icon name={tile.icon as any} size={24} />
                    </span>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-navy/60">
                        {t(tile.labelKey)}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-2xl font-bold text-navy">
                          {reading ? reading.value.toFixed(tile.type === "temperature" ? 1 : 0) : "—"}
                        </span>
                        <span className="text-xs text-navy/60">{tile.unit}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card hoverable={false}>
                <SectionHead title={t("next_medicine_title")} />
                <div className="flex items-center gap-3 rounded-xl border border-line bg-mint/[0.08] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-tint text-brand">
                    <Icon name="pill" size={20} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-navy">
                      {next ?? t("no_upcoming_medicine")}
                    </div>
                    <div className="mt-0.5 text-xs text-navy/60">
                      {medications.length > 0
                        ? `${medications.length} ${t("medications")}`
                        : t("no_medications_scheduled")}
                    </div>
                  </div>
                </div>
              </Card>
              <CarePlanEditor patientId={patient.id} />
            </div>
          </div>
        )}

        {tab === "vitals" && (
          <Card hoverable={false}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {VITAL_TILES.map((tile) => (
                  <button
                    key={tile.type}
                    type="button"
                    onClick={() => setVitalType(tile.type)}
                    aria-pressed={vitalType === tile.type}
                    className={[
                      "min-h-[40px] rounded-xl px-3 text-xs font-semibold transition-colors",
                      vitalType === tile.type
                        ? "bg-teal text-white"
                        : "border border-line bg-white text-navy/70 hover:bg-teal/10",
                    ].join(" ")}
                  >
                    {t(tile.labelKey)}
                  </button>
                ))}
              </div>
              <div className="flex rounded-xl border border-line bg-teal/10 p-0.5">
                {(["1h", "24h"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRange(value)}
                    aria-pressed={range === value}
                    className={[
                      "min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors",
                      range === value
                        ? "bg-white text-teal shadow-sm"
                        : "text-navy/70",
                    ].join(" ")}
                  >
                    {t(value === "1h" ? "range_1h" : "range_24h")}
                  </button>
                ))}
              </div>
            </div>
            {vitalsLoading ? (
              <ChartSkeleton className="border-0 p-0" />
            ) : (
              <VitalsChart readings={readings} vitalType={vitalType} range={range} />
            )}
          </Card>
        )}

        {tab === "medication" && (
          <MedicationReminder
            patientId={patient.id}
            medications={medications}
            events={eventRows}
            onChanged={reloadEvents}
          />
        )}

        {tab === "history" && (
          <Card hoverable={false}>
            <SectionHead title={t("patient_alerts")} />
            {patientAlerts.length === 0 ? (
              <EmptyState icon="bell" title={t("no_alerts_for_patient")} />
            ) : (
              <div className="space-y-2.5">
                {patientAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-line p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          SEVERITY_TONE[alert.severity] ?? SEVERITY_TONE.info
                        }`}
                      >
                        {t(`severity_${alert.severity}`)}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-navy/60">
                        {alert.status}
                      </span>
                      <span className="ml-auto text-[10px] text-navy/60">
                        {formatDateTime(alert.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-navy">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </main>
    </Page>
  )
}
