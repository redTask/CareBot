import { useState } from "react"
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
import SectionHead from "./SectionHead"
import Btn from "./Btn"
import EmptyState from "./EmptyState"

const STATUS_CONFIG: Record<string, { pill: string; labelKey: string }> = {
  queued: { pill: "bg-[#F1F4F9] text-[#64748B]", labelKey: "status_queued" },
  running: { pill: "bg-brand-tint text-[#1F55D6]", labelKey: "status_running" },
  done: { pill: "bg-normal-light text-normal-dark", labelKey: "status_done" },
  failed: { pill: "bg-critical-light text-critical-dark", labelKey: "status_failed" },
  cancelled: { pill: "bg-[#F1F4F9] text-[#64748B]", labelKey: "status_cancelled" },
}

const PRIORITY: Record<string, number> = {
  emergency: 0,
  patient_call: 1,
  medication: 2,
  delivery: 3,
  patrol: 4,
}

export default function TaskQueue() {
  const tasks = useAppStore((state) => state.tasks)
  const updateTask = useAppStore((state) => state.updateTask)
  const setTasks = useAppStore((state) => state.setTasks)
  const user = useAppStore((state) => state.user)
  const [busy, setBusy] = useState(false)

  const active = tasks.filter((task) => ["queued", "running"].includes(task.status))
  const finished = tasks.filter((task) => !["queued", "running"].includes(task.status))
  const visible = [...active].sort(
    (a, b) => (PRIORITY[a.priority] ?? 9) - (PRIORITY[b.priority] ?? 9)
  ).concat(finished)

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

  return (
    <Card>
      <SectionHead title={t("task_queue")} caption={t("tasks_count", { count: active.length })} />
      {user?.role === "admin" && finished.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          disabled={busy}
          className="mb-3 inline-flex min-h-[36px] items-center rounded-lg px-2 text-xs font-semibold text-[#64748B] transition-colors hover:bg-[#F1F4F9] disabled:opacity-60"
        >
          {t("clear_old_tasks")}
        </button>
      )}
      {visible.length === 0 ? (
        <EmptyState icon="clipboard" title={t("tasks_empty")} />
      ) : (
        <div className="space-y-2.5">
          {visible.map((task) => {
            const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.queued
            const isActive = ["queued", "running"].includes(task.status)
            return (
              <div key={task.id} className="rounded-xl border border-[#E6EBF2] p-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.pill}`}
                  >
                    {t(cfg.labelKey)}
                  </span>
                  <span className="truncate text-sm font-semibold capitalize text-[#0F172A]">
                    {task.type.replace(/_/g, " ")}
                  </span>
                  <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {task.priority}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-[#94A3B8]">
                    {task.bed_id != null ? t("bed_x", { id: task.bed_id }) : t("system")} •{" "}
                    {task.robot_id != null
                      ? t("robot_x", { id: task.robot_id })
                      : t("robot_unassigned")}{" "}
                    • {formatTime(task.created_at)}
                  </span>
                  {isActive && (
                    <div className="flex gap-1.5">
                      {task.status === "queued" && (
                        <Btn
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() => run(() => assignTask(task.id), task.id, "running")}
                        >
                          {t("assign")}
                        </Btn>
                      )}
                      {task.status === "running" && (
                        <Btn
                          variant="secondary"
                          size="sm"
                          disabled={busy}
                          onClick={() => run(() => completeTask(task.id), task.id, "done")}
                        >
                          {t("complete")}
                        </Btn>
                      )}
                      <Btn
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        onClick={() => run(() => cancelTask(task.id), task.id, "cancelled")}
                      >
                        {t("cancel")}
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
