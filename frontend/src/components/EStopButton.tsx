import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { getLang, t } from "../lib/i18n"
import Btn from "./Btn"
import Icon from "./Icon"

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
          <span className="text-xs font-bold uppercase tracking-wider text-critical-dark bg-critical-light px-2.5 py-0.5 rounded">
            {t("robots_stopped")}
          </span>
          <Btn
            onClick={handleResume}
            disabled={!isNurseOrDoctor}
            variant={isNurseOrDoctor ? "primary" : "secondary"}
          >
            {t("resume")}
          </Btn>
        </>
      ) : (
        <Btn
          onClick={handleEstop}
          disabled={confirming}
          variant="danger"
          size="lg"
          className="w-12 h-12 p-0 justify-center"
          title={t("emergency_stop")}
          aria-label={t("emergency_stop")}
        >
          <Icon name="alert-triangle" size={20} className="text-white" />
        </Btn>
      )}
      {confirming && (
        <Btn variant="danger" size="md" onClick={handleEstop} className="w-full">
          {t("confirm_stop")}
        </Btn>
      )}
    </div>
  )
}
