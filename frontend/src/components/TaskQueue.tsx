import { useAppStore } from "../store/useStore"
import { cancelTask, completeTask, assignTask } from "../lib/api"
import { getLang, t } from "../lib/i18n"

const STATUS_CONFIG: Record<string, { color: string; bg: string; labelKey: string }> = {
  queued: { color: "text-gray-800", bg: "bg-gray-100", labelKey: "status_queued" },
  running: { color: "text-blue-800", bg: "bg-blue-100", labelKey: "status_running" },
  done: { color: "text-green-800", bg: "bg-green-100", labelKey: "status_done" },
  failed: { color: "text-red-800", bg: "bg-red-100", labelKey: "status_failed" },
  cancelled: { color: "text-gray-700", bg: "bg-gray-100", labelKey: "status_cancelled" },
}

const ML_STATUS_TEXT: Record<string, string> = {
  status_queued: "ക്യൂവിലെ",
  status_running: "നടക്കുന്നു",
  status_done: "പൂർത്തിയായി",
  status_failed: "പരാജയപ്പെട്ടു",
  status_cancelled: "രദ്ദാക്കി",
}

export default function TaskQueue() {
  const { tasks, updateTask } = useAppStore()
  const lang = getLang()

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 text-base mb-4">{t("task_queue")}</h3>
        <p className="text-sm text-gray-500">{t("no_tasks")}</p>
      </div>
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
    lang === "ml" ? ML_STATUS_TEXT[key] : t(key)

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-base">{t("task_queue")}</h3>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          {tasks.length === 1
            ? t("task_count_single", { count: tasks.length })
            : t("tasks_count", { count: tasks.length })}
        </span>
      </div>
      <div className="space-y-3">
        {sorted.map((task) => {
          const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.queued
          const borderClass =
            task.status === "running"
              ? "border-blue-200"
              : task.status === "done"
                ? "border-green-200"
                : task.status === "failed"
                  ? "border-red-200"
                  : "border-gray-200"

          return (
            <div
              key={task.id}
              className={`flex items-center justify-between p-3 rounded-xl border bg-white ${borderClass}`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                    {statusText(cfg.labelKey)}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {task.priority}
                  </span>
                </div>
                <div className="text-sm text-gray-800 truncate">
                  {task.type.replace("_", " ")}
                  {task.bed_id != null ? ` &bull; ${t("bed_x", { id: task.bed_id })}` : ""}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {t("robot_x", { id: task.robot_id ?? t("robot_unassigned") })} &bull;
                  {new Date(task.created_at!).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                {task.status === "queued" && (
                  <button
                    onClick={() => handleAssign(task.id)}
                    className="min-h-[40px] px-3 py-2 rounded text-sm font-semibold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
                  >
                    {t("assign")}
                  </button>
                )}
                {task.status === "running" && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="min-h-[40px] px-3 py-2 rounded text-sm font-semibold bg-green-50 text-green-800 border border-green-200 hover:bg-green-100"
                  >
                    {t("complete")}
                  </button>
                )}
                {["queued", "running"].includes(task.status) && (
                  <button
                    onClick={() => handleCancel(task.id)}
                    className="min-h-[40px] px-3 py-2 rounded text-sm font-semibold bg-red-50 text-red-800 border border-red-200 hover:bg-red-100"
                  >
                    {t("cancel")}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
