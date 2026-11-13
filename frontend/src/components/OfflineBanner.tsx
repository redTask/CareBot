import { useAppStore } from "../store/useStore"
import { t } from "../lib/i18n"
import { formatTime } from "../lib/format"

export default function OfflineBanner() {
  const online = useAppStore((state) => state.online)
  const lastUpdated = useAppStore((state) => state.lastUpdated)

  if (online) return null

  return (
    <div
      className="border-b border-[#FCD34D] bg-watch-light px-4 py-2 text-watch-dark"
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-xs font-semibold sm:px-6 lg:px-8">
        <span className="h-2 w-2 animate-pulse rounded-full bg-critical-dark" aria-hidden="true" />
        <span>
          {t("offline")} — {t("last_update")} {formatTime(lastUpdated)}
        </span>
        <span className="opacity-75">Reconnecting…</span>
      </div>
    </div>
  )
}
