import { useEffect, useState } from "react"
import { fetchAuditLogs } from "../lib/api"
import { t } from "../lib/i18n"
import { formatDateTime } from "../lib/format"
import Page from "./Page"
import Card from "./Card"
import AppHeader from "./AppHeader"
import EmptyState from "./EmptyState"
import Icon from "./Icon"

export default function AuditLogView() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => {
        console.error("Failed to fetch audit logs", err)
        setError(err.message || t("error"))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Page>
      <AppHeader active="audit" />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-tint text-brand">
            <Icon name="file-text" size={24} />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">
              {t("audit_log")}
            </h1>
            <p className="mt-1 text-sm text-navy/70">{t("audit_subtitle")}</p>
          </div>
        </div>

        {error && (
          <Card hoverable={false} className="mb-4 border-navy/30 bg-navy/[0.05]">
            <p className="text-sm font-semibold text-navy">{error}</p>
          </Card>
        )}

        {loading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-12 rounded-xl bg-white" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card hoverable={false}>
            <EmptyState icon="file-text" title={t("no_audit_entries")} />
          </Card>
        ) : (
          <Card padded={false} hoverable={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-teal/10">
                  <tr>
                    {[t("time"), t("user"), t("action"), t("entity"), t("details")].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-navy/60"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-mint/[0.08]">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy/70">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy">
                        {log.user_id != null ? t("user_x", { id: log.user_id }) : t("system")}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-navy">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-navy/70">{log.entity}</td>
                      <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-navy/60">
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>
    </Page>
  )
}
