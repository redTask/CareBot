import { useAppStore } from "../store/useStore"
import { cancelTask, completeTask, assignTask } from "../lib/api"
import { getLang, t } from "../lib/i18n"
import Card from "./Card"
import SectionHead from "./SectionHead"
import Btn from "./Btn"

const ML_STATUS_TEXT: Record<string, string> = {
  status_queued: "ക്യൂവിലെ",
  status_running: "നടക്കുന്നു",
  status_done: "പൂർത്തിയായി",
  status_failed: "പരാജയപ്പെട്ടു",
  status_cancelled: "രദ്ദാക്കി",
}

const STATUS_CONFIG: Record<string, {
  pill: string
  pillText: string
  border: string
  labelKey: string
}> = {
  queued: { pill: "bg-[#F1F4F9]", pillText: "text-[#64748B]", border: "border-[#E6EBF2]", labelKey: "status_queued" },
  running: { pill: "bg-brand-tint", pillText: "text-[#1F55D6]", border: "border-[#EAF0FF]", labelKey: "status_running" },
  done: { pill: "bg-normal-light", pillText: "text-normal-dark", border: "border-[#E8F7EE]", labelKey: "status_done" },
  failed: { pill: "bg-critical-light", pillText: "text-critical-dark", border: "border-[#FDE8E8]", labelKey: "status_failed" },
  cancelled: { pill: "bg-[#F1F4F9]", pillText: "text-[#64748B]", border: "border-[#E6EBF2]", labelKey: "status_cancelled" },
}

export default function TaskQueue() {
  const { tasks, updateTask } = useAppStore()
  const lang = getLang()

  if (tasks.length === 0) {
    return (
      <Card>
        <SectionHead title={t("task_queue")} caption={t("no_tasks")} />
      </Card>
    )
  }

  const handleCancel = async (id: number) => {
    try {
      await cancelTask(id)
      updateTask({ id, status: "cancelled" })
    } catch (err) {
      console.error("Failed to cancel task", err)
    }
  }

  const handleComplete = async (id: number) => {
    try {
      await completeTask(id)
      updateTask({ id, status: "done" })
    } catch (err) {
      console.error("Failed to complete task", err)
    }
  }

  const handleAssign = async (id: number) => {
    try {
      await assignTask(id)
    } catch (err) {
      console.error("Failed to assign task", err)
    }
  }

  const sorted = [...tasks].sort((a, b) => {
    const order: Record<string, number> = {
      emergency: 0,
      patient_call: 1,
      medication: 2,
      delivery: 3,
      patrol: 4,
    }
    return (order[a.priority] ?? 99) - (order[b.priority] ?? 99)
  })

  const statusText = (key: string) =>
    lang === "ml" ? (ML_STATUS_TEXT[key] ?? t(key)) : t(key)

  return (
    <Card>
      <SectionHead title={t("task_queue")} />
      <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block mb-2">
        {tasks.length === 1 ? t("task_count_single", { count: tasks.length }) : t("tasks_count", { count: tasks.length })}
      </span>
      <div className="space-y-3">
        {sorted.map((task) => {
          const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.queued
          return (
            <div
              key={task.id}
              className={`flex items-center justify-between p-4 rounded-xl border bg-white ${cfg.border} transition-all duration-150`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.pillText}`}>
                    {statusText(cfg.labelKey)}
                  </span>
                  <span className="text-xs text-[#94A3B8] ml-auto">{task.priority}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[#0F172A] truncate">
                    {task.type.replace("_", " ")}
                    {task.bed_id != null ? ` • ${t("bed_x", { id: task.bed_id })}` : ""}
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-1">
                    {t("robot_x", { id: task.robot_id ?? t("robot_unassigned") })} •{" "}
                    {new Date(task.created_at!).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {task.status === "queued" && (
                  <Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAssign(task.id)}
                  >
                    {t("assign")}
                  </Btn>
                )}
                {task.status === "running" && (
                  <Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => handleComplete(task.id)}
                  >
                    {t("complete")}
                  </Btn>
                )}
                {["queued", "running"].includes(task.status) && (
                  <Btn variant="danger" size="sm" onClick={() => handleCancel(task.id)}>
                    {t("cancel")}
                  </Btn>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
