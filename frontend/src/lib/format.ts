// All API timestamps are UTC ISO strings ending in "Z". These helpers convert
// them to the browser's local timezone for display.

function parse(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatTime(value?: string | null): string {
  const date = parse(value)
  if (!date) return "—"
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export function formatDateTime(value?: string | null): string {
  const date = parse(value)
  if (!date) return "—"
  const today = new Date()
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  if (sameDay) return formatTime(value)
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function isToday(value?: string | null): boolean {
  const date = parse(value)
  if (!date) return false
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

const STATUS_ORDER: Record<string, number> = {
  critical: 0,
  watch: 1,
  normal: 2,
}

export function severityRank(status?: string): number {
  return STATUS_ORDER[status ?? "normal"] ?? 3
}
