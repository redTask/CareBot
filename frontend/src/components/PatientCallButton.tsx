import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { API_BASE } from "../lib/api"
import { t } from "../lib/i18n"
import Card from "./Card"
import Btn from "./Btn"
import Icon from "./Icon"

export default function PatientCallButton() {
  const token = useAppStore((state) => state.token)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleCall = async () => {
    setBusy(true)
    try {
      const res = await fetch(`${API_BASE}/alerts/patient_call`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(t("error"))
      setSent(true)
    } catch (err) {
      console.error("Patient call error", err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
          <Icon name="phone" size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-navy">
            {t("simulate_patient_call")}
          </h3>
          <p className="mt-0.5 text-xs text-navy/60">{t("high_priority_alert")}</p>
        </div>
      </div>
      <Btn onClick={handleCall} disabled={sent || busy} className="mt-4 w-full">
        <Icon name="phone" size={16} className="mr-2" />
        {sent ? t("call_sent") : t("simulate_patient_call")}
      </Btn>
    </Card>
  )
}
