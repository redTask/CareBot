import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { getLang, t } from "../lib/i18n"

export default function PatientCallButton() {
  const { token } = useAppStore()
  const [sent, setSent] = useState(false)
  const lang = getLang()

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
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCall}
        disabled={sent}
        className="w-full py-3 rounded-xl bg-orange-600 text-white font-semibold text-sm hover:bg-orange-700 disabled:opacity-60 transition-all active:scale-[0.98]"
      >
        {sent ? t("call_sent") : t("simulate_patient_call")}
      </button>
      {sent && (
        <span className="text-[10px] text-green-800 font-semibold">
          {t("high_priority_alert")}
        </span>
      )}
    </div>
  )
}
