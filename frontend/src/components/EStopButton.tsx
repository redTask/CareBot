import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { getLang, t } from "../lib/i18n"

export default function EStopButton() {
  const { token, user } = useAppStore()
  const [confirming, setConfirming] = useState(false)
  const [stopped, setStopped] = useState(false)

  const handleEstop = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/alerts/estop`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("E-stop failed")
      setStopped(true)
      setConfirming(false)
    } catch (err) {
      console.error("E-stop error", err)
      setConfirming(false)
    }
  }

  const handleResume = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/alerts/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Resume failed")
      setStopped(false)
    } catch (err) {
      console.error("Resume error", err)
    }
  }

  const lang = getLang()
  const isNurseOrDoctor = user?.role === "nurse" || user?.role === "doctor"

  return (
    <div className="flex items-center gap-3">
      {stopped ? (
        <>
          <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
            {t("robots_stopped")}
          </span>
          <button
            onClick={handleResume}
            disabled={!isNurseOrDoctor}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-[0.98] ${
              !isNurseOrDoctor
                ? "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed"
                : "bg-red-600 text-white border-red-700 hover:bg-red-700"
            }`}
          >
            {t("resume")}
          </button>
        </>
      ) : (
        <button
          onClick={handleEstop}
          disabled={confirming}
          className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 active:scale-95 transition-all"
          title={t("emergency_stop")}
          aria-label={t("emergency_stop")}
        >
          &#x26A0;
        </button>
      )}
      {confirming && (
        <button
          onClick={handleEstop}
          className="px-3 py-1.5 rounded text-xs font-bold bg-red-700 text-white hover:bg-red-800"
        >
          {t("confirm_stop")}
        </button>
      )}
    </div>
  )
}
