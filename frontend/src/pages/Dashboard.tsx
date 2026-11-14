import { useEffect, useMemo, useState } from "react"
import { useAppStore } from "../store/useStore"
import { fetchBeds, fetchRobots, fetchAlerts, fetchTasks } from "../lib/api"
import AppHeader from "../components/AppHeader"
import FloorPlan from "../components/FloorPlan"
import RobotPanel from "../components/RobotPanel"
import AlertsPanel from "../components/AlertsPanel"
import TaskQueue from "../components/TaskQueue"
import PatientCallButton from "../components/PatientCallButton"
import CriticalAlertBanner from "../components/CriticalAlertBanner"
import OfflineBanner from "../components/OfflineBanner"
import BedCard from "../components/BedCard"
import Page from "../components/Page"
import Card from "../components/Card"
import Icon from "../components/Icon"
import EmptyState from "../components/EmptyState"
import { CardSkeleton } from "../components/Skeleton"
import { t } from "../lib/i18n"
import { formatTime, severityRank } from "../lib/format"

type Filter = "all" | "critical" | "watch"

export default function Dashboard() {
  const setBeds = useAppStore((state) => state.setBeds)
  const setRobots = useAppStore((state) => state.setRobots)
  const setAlerts = useAppStore((state) => state.setAlerts)
  const setTasks = useAppStore((state) => state.setTasks)
  const beds = useAppStore((state) => state.beds)
  const robots = useAppStore((state) => state.robots)
  const alerts = useAppStore((state) => state.alerts)
  const lastUpdated = useAppStore((state) => state.lastUpdated)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")

  useEffect(() => {
    let mounted = true
    const refresh = async (showLoading: boolean) => {
      if (showLoading) setLoading(true)
      try {
        const [bedsData, robotsData, alertsData, tasksData] = await Promise.all([
          fetchBeds(),
          fetchRobots(),
          fetchAlerts(),
          fetchTasks(),
        ])
        if (mounted) {
          setBeds(bedsData)
          setRobots(robotsData)
          setAlerts(alertsData)
          setTasks(tasksData)
          setError("")
        }
      } catch (err: any) {
        if (mounted) setError(err.message || t("error"))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    refresh(true)
    const timer = window.setInterval(() => refresh(false), 10000)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [setBeds, setRobots, setAlerts, setTasks])

  const patients = beds.filter((bed) => bed.patient)
  const criticalCount = patients.filter((bed) => bed.status === "critical").length
  const watchCount = patients.filter((bed) => bed.status === "watch").length
  const robotsActive = robots.filter(
    (robot) => robot.status !== "offline" && robot.status !== "stopped"
  ).length

  const visibleBeds = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return patients
      .filter((bed) => (filter === "all" ? true : bed.status === filter))
      .filter((bed) => {
        if (!needle) return true
        return (
          bed.patient!.name.toLowerCase().includes(needle) ||
          bed.label.toLowerCase().includes(needle)
        )
      })
      .sort((a, b) => {
        const bySeverity = severityRank(a.status) - severityRank(b.status)
        if (bySeverity !== 0) return bySeverity
        return a.label.localeCompare(b.label)
      })
  }, [patients, filter, query])

  const stats = [
    {
      key: "all",
      label: t("patients"),
      value: patients.length,
      icon: "users",
      tone: "text-navy bg-brand-tint",
    },
    {
      key: "critical",
      label: t("critical"),
      value: criticalCount,
      icon: "alert-triangle",
      tone: "text-white bg-navy",
    },
    {
      key: "watch",
      label: t("watch"),
      value: watchCount,
      icon: "alert-circle",
      tone: "text-white bg-teal",
    },
    {
      key: "robots",
      label: t("robots_active"),
      value: robotsActive,
      icon: "robot",
      tone: "text-navy bg-lime",
    },
  ] as const

  const chips: Array<{ key: Filter; label: string; count: number }> = [
    { key: "all", label: t("filter_all"), count: patients.length },
    { key: "critical", label: t("critical"), count: criticalCount },
    { key: "watch", label: t("watch"), count: watchCount },
  ]

  const criticalAlerts = alerts.filter(
    (alert) => alert.status === "open" && alert.severity === "critical"
  ).length

  return (
    <Page>
      <AppHeader active="dashboard" />
      <OfflineBanner />
      <CriticalAlertBanner />

      <main className="mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
              {t("ward_overview")}
            </h1>
            <p className="mt-1 text-sm text-navy/70">
              {t("ward_overview_subtitle")}
              {lastUpdated && (
                <span className="ml-2 text-xs text-navy/60">
                  • {t("last_update")} {formatTime(lastUpdated)}
                </span>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => {
              const isFilter = stat.key !== "robots"
              const selected = isFilter && filter === stat.key
              return (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => {
                    if (isFilter) {
                      setFilter(stat.key as Filter)
                    } else {
                      document.getElementById("robots")?.scrollIntoView({ behavior: "smooth" })
                    }
                  }}
                  aria-pressed={isFilter ? selected : undefined}
                  className={[
                    "flex min-h-[76px] items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition-all duration-150 hover:shadow-md",
                    selected
                      ? "border-brand ring-2 ring-brand/20"
                      : "border-line",
                  ].join(" ")}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}
                  >
                    <Icon name={stat.icon as any} size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xl font-bold leading-none text-navy">
                      {stat.value}
                    </span>
                    <span className="mt-1 block truncate text-[10px] font-semibold uppercase tracking-wider text-navy/60">
                      {stat.label}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/60">
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search_placeholder")}
              className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              aria-label={t("search_placeholder")}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilter(chip.key)}
                aria-pressed={filter === chip.key}
                className={[
                  "min-h-[40px] rounded-full px-3 text-xs font-semibold transition-colors",
                  filter === chip.key
                    ? "bg-navy text-white"
                    : "border border-line bg-white text-navy/70 hover:bg-teal/10",
                ].join(" ")}
              >
                {chip.label}
                <span className="ml-1.5 opacity-70">{chip.count}</span>
              </button>
            ))}
            {criticalAlerts > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                <Icon name="alert-triangle" size={16} />
                {t("critical_count", { count: criticalAlerts })}
              </span>
            )}
          </div>
        </div>

        {error && (
          <Card className="mt-4 border-critical-light bg-critical-light/40" hoverable={false}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-critical-dark">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-xs font-semibold underline underline-offset-2"
              >
                {t("dismiss")}
              </button>
            </div>
          </Card>
        )}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : visibleBeds.length === 0 ? (
              <Card hoverable={false}>
                <EmptyState icon="users" title={t("no_patients_match")} />
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleBeds.map((bed, index) => (
                  <BedCard key={bed.id} bed={bed} index={index} />
                ))}
              </div>
            )}

            <div className="mt-5">
              <FloorPlan beds={beds} robots={robots} />
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <div id="alerts" className="scroll-mt-20">
              <AlertsPanel />
            </div>
            <div id="robots" className="scroll-mt-20">
              <RobotPanel robots={robots} />
            </div>
            <div id="tasks" className="scroll-mt-20">
              <TaskQueue />
            </div>
            <PatientCallButton />
          </aside>
        </div>

        <footer className="mt-10 rounded-2xl bg-navy px-4 py-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/85">
            {t("research_prototype")}
          </p>
        </footer>
      </main>
    </Page>
  )
}
