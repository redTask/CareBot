import { useEffect, useState } from "react"
import { useAppStore } from "../store/useStore"
import { fetchAuditLogs } from "../lib/api"
import { t } from "../lib/i18n"

export default function AuditLogView() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => console.error("Failed to fetch audit logs", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <span className="text-sm text-gray-500">{t("loading_patient")}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t("audit_log")}</h1>
        <p className="text-gray-600 text-sm mt-1">
          {t("audit_subtitle")}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t("time")}
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t("user")}
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t("action")}
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t("entity")}
              </th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t("details")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                  {new Date(log.timestamp!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {log.user_id != null ? t("user_x", { id: log.user_id }) : t("system")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                  {log.action}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.entity}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {JSON.stringify(log.details || {})}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                  {t("no_audit_entries")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
