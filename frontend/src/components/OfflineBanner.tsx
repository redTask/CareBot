import { useAppStore } from "../store/useStore"

export default function OfflineBanner() {
  const { online, lastUpdated } = useAppStore((state) => ({
    online: state.online,
    lastUpdated: state.lastUpdated,
  }))

  if (online) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] bg-amber-900 text-amber-100 px-4 py-2.5 text-center text-sm font-medium"
      role="alert"
      aria-live="polite"
    >
      <span className="flex items-center justify-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
        <span>Offline — last updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—"}</span>
        <span className="text-[#FCD34D] animate-pulse">Reconnecting…</span>
      </span>
    </div>
  )
}
