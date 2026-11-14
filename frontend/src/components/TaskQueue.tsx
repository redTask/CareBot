import { useMemo, useState } from "react"
import { useAppStore } from "../store/useStore"
import {
  cancelTask,
  completeTask,
  assignTask,
  clearOldTasks,
  fetchTasks,
} from "../lib/api"
import { t } from "../lib/i18n"
import { formatTime } from "../lib/format"
import Card from "./Card"
import Icon from "./Icon"
import EmptyState from "./EmptyState"

// Palette-safe status pills: every pairing keeps navy or white readable.
const STATUS_CONFIG: Record<string, { pill: string; labelKey: string }> = {
  queued: { pill: "bg-teal/15 text-navy", labelKey: "status_queued" },
  running: { pill: "bg-mint text-navy", labelKey: "status_running" },
  done: { pill: "bg-lime text-navy", labelKey: "status_done" },
  failed: { pill: "bg-navy text-white", labelKey: "status_failed" },
  cancelled: { pill: "bg-navy/10 text-navy/70", labelKey: "status_cancelled" },
}

const PRIORITY: Record<string, number> = {
  emergency: 0,
  patient_call: 1,
  medication: 2,
  delivery: 3,
  patrol: 4,
}

const ACTIVE_STATUSES = ["queued", "running"]
const RECENT_FINISHED = 3

export default function TaskQueue() {
  const tasks = useAppStore((state) => state.tasks)
  const updateTask = useAppStore((state) => state.updateTask)
  const setTasks = useAppStore((state) => state.setTasks)
  const user = useAppStore((state) => state.user)
  const [busy, setBusy] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const active = useMemo(
    () =>
      tasks
        .filter((task) => ACTIVE_STATUSES.includes(task.status))
        .sort((a, b) => (PRIORITY[a.priority] ?? 9) - (PRIORITY[b.priority] ?? 9)),
    [tasks]
  )

  // Finished tasks, newest first. The first three stay visible; the remainder
  // live behind the history toggle.
  const finished = useMemo(
    () =>
      tasks
        .filter((task) => !ACTIVE_STATUSES.includes(task.status))
        .sort(
          (a, b) =>
            new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
            new Date(a.updated_at ?? a.created_at ?? 0).getTime()
        ),
    [tasks]
  )

  const recentFinished = finished.slice(0, RECENT_FINISHED)
  const olderFinished = finished.slice(RECENT_FINISHED)

  const run = async (action: () => Promise<unknown>, id: number, status: string) => {
    setBusy(true)
    try {
      await action()
      updateTask({ id, status })
    } catch (err) {
      console.error("Task action failed", err)
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    setBusy(true)
    try {
      await clearOldTasks()
      setTasks(await fetchTasks())
    } catch (err) {
      console.error("Failed to clear old tasks", err)
    } finally {
      setBusy(false)
    }
  }

  const renderRow = (task: (typeof tasks)[number]) => {
    const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.queued
    const isActive = ACTIVE_STATUSES.includes(task.status)
    return (
      <div
        key={task.id}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-mint/[0.12]"
      >
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.pill}`}
        >
          {t(cfg.labelKey)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold capitalize text-navy">
          {task.type.replace(/_/g, " ")}
        </span>
        <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-navy/60">
          {task.bed_id != null ? t("bed_x", { id: task.bed_id }) : t("system")} ·{" "}
          {task.robot_id != null ? t("robot_x", { id: task.robot_id }) : t("robot_unassigned")}{" "}
          · {formatTime(task.created_at)}
        </span>
        {isActive && (
          <span className="flex shrink-0 items-center gap-1">
            {task.status === "queued" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => assignTask(task.id), task.id, "running")}
                aria-label={t("assign")}
                title={t("assign")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-teal text-navy transition-colors hover:bg-brand-tint disabled:opacity-40"
              >
                <Icon name="power" size={16} />
              </button>
            )}
            {task.status === "running" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => completeTask(task.id), task.id, "done")}
                aria-label={t("complete")}
                title={t("complete")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-teal bg-lime text-navy transition-colors hover:bg-mint disabled:opacity-40"
              >
                <Icon name="circle-check" size={16} />
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => cancelTask(task.id), task.id, "cancelled")}
              aria-label={t("cancel")}
              title={t("cancel")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line text-navy/70 transition-colors hover:bg-teal/10 hover:text-navy disabled:opacity-40"
            >
              <Icon name="x-circle" size={16} />
            </button>
          </span>
        )}
      </div>
    )
  }

  return (
    <Card padded={false} className="flex max-h-[320px] flex-col overflow-hidden">
      {/* Fixed header: title, active count badge, view-all link. */}
      <div className="shrink-0 border-b border-line px-4 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold font-heading text-navy">
            {t("task_queue")}
          </h3>
          <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
            {t("active", { count: active.length })}
          </span>
          <a
            href="/dashboard#tasks"
            className="ml-auto inline-flex items-center gap-1 text-base font-bold text-teal hover:text-navy"
          >
            {t("view_all_tasks")}
            <Icon name="arrow-left" size={16} className="rotate-180" />
          </a>
        </div>
      </div>

      {/* Fixed-height, internally scrolling list. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {active.length === 0 && recentFinished.length === 0 ? (
          <EmptyState icon="clipboard" title={t("tasks_empty")} className="m-2" />
        ) : (
          <div className="space-y-1">
            {active.map(renderRow)}
            {recentFinished.length > 0 && active.length > 0 && (
              <div className="my-1 border-t border-line" aria-hidden="true" />
            )}
            {recentFinished.map(renderRow)}
          </div>
        )}

        {olderFinished.length > 0 && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              aria-expanded={historyOpen}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-navy/70 transition-colors hover:bg-teal/10 hover:text-navy"
            >
              <Icon name={historyOpen ? "chevron-up" : "chevron-down"} size={16} />
              {historyOpen
                ? t("hide_history", { count: olderFinished.length })
                : t("show_history", { count: olderFinished.length })}
            </button>
            {historyOpen && (
              <div className="space-y-1">
                {olderFinished.map(renderRow)}
                {/* Admin-only destructive housekeeping stays inside history. */}
                {user?.role === "admin" && (
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={busy}
                    className="mt-1 inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border border-teal px-2 text-xs font-bold text-navy transition-colors hover:bg-brand-tint disabled:opacity-50"
                  >
                    {t("clear_old_tasks")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
