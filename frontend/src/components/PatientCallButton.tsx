import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { getLang, t } from "../lib/i18n"
import Card from "./Card"
import Btn from "./Btn"
import Icon from "./Icon"

export default function PatientCallButton() {
  const { token } = useAppStore()
  const [sent, setSent] = useState(false)

  const handleCall = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/alerts/patient_call`, {
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
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <Btn onClick={handleCall} disabled={sent} className="w-full">
          <Icon name="phone" size={20} className="mr-2" />
          {sent ? t("call_sent") : t("simulate_patient_call")}
        </Btn>
        {sent && (
          <span className="text-xs font-semibold text-normal-dark">
            {t("high_priority_alert")}
          </span>
        )}
      </div>
    </Card>
  )
}
