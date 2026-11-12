import { useEffect, useState } from "react"
import { useAppStore } from "../store/useStore"
import { connectWS, disconnectWS } from "../lib/ws"
import { fetchBeds, fetchRobots, fetchAlerts, fetchTasks } from "../lib/api"
import FloorPlan from "../components/FloorPlan"
import RobotPanel from "../components/RobotPanel"
import AlertsPanel from "../components/AlertsPanel"
import TaskQueue from "../components/TaskQueue"
import PatientCallButton from "../components/PatientCallButton"
import CriticalAlertBanner from "../components/CriticalAlertBanner"
import EStopButton from "../components/EStopButton"
import LanguageToggle from "../components/LanguageToggle"
import OfflineBanner from "../components/OfflineBanner"
import { t } from "../lib/i18n"
import { API_BASE } from "../lib/api"

export default function Dashboard() {
  const setBeds = useAppStore((state) => state.setBeds)
  const setRobots = useAppStore((state) => state.setRobots)
  const setAlerts = useAppStore((state) => state.setAlerts)
  const setTasks = useAppStore((state) => state.setTasks)
  const token = useAppStore((state) => state.token)
  const online = useAppStore((state) => state.online)
  const robots = useAppStore((state) => state.robots)
  const beds = useAppStore((state) => state.beds)
  const alerts = useAppStore((state) => state.alerts)
  const lastUpdated = useAppStore((state) => state.lastUpdated)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const [bedsData, robotsData, alertsData, tasksData] =
          await Promise.all([fetchBeds(), fetchRobots(), fetchAlerts(), fetchTasks()])
        if (mounted) {
          setBeds(bedsData)
          setRobots(robotsData)
          setAlerts(alertsData)
          setTasks(tasksData)
        }
      } catch (err: any) {
        if (mounted) setError(err.message || t("error"))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    const wsUrl = API_BASE.replace(/^http/, "ws")
    connectWS(wsUrl, token)
    return () => {
      mounted = false
      disconnectWS()
    }
  }, [token, setBeds, setRobots, setAlerts, setTasks])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* Offline banner (top) */}
      <OfflineBanner />

      {/* Critical alert banner (fixed bottom) */}
      <CriticalAlertBanner />

      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500">{t("loading")}</p>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="max-w-5xl mx-auto p-3 mb-4">
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 flex items-center gap-2">
                <span>{error}</span>
                <button
                  onClick={() => setError("")}
                  className="text-xs underline font-medium"
                >
                  {t("dismiss")}
                </button>
              </div>
            </div>
          )}
          <header className="sticky top-0 z-40 h-14 bg-white/90 backdrop-blur border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 px-4 py-2.5 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
            {t("app_name")} &mdash; {t("ward_dashboard")}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {t("live_monitoring")} &bull;
            <span className={`font-semibold ${online ? "text-green-800" : "text-red-800"}`}>
              {online ? t("connected") : t("offline")}
            </span>{" "}
            {lastUpdated ? `(${t("last_update")} ${new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            {t("research_prototype")}
          </span>
          <EStopButton />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FloorPlan beds={beds} />
        </div>
        <div className="space-y-6">
          <RobotPanel robots={robots} />
          <AlertsPanel />
          <TaskQueue />
          <PatientCallButton />
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider">
          {t("research_prototype")}
        </p>
      </footer>
      </>
    )}
    </div>
  )
}
