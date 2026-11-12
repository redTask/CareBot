import { t } from "../lib/i18n"

// Status pill: always colour + tint + text, never colour alone.
type StatusVariant = "normal" | "watch" | "critical"

const STATUS_CONFIG: Record<StatusVariant, { bg: string; text: string }> = {
  normal: { bg: "bg-normal-light", text: "text-normal-dark" },
  watch: { bg: "bg-watch-light", text: "text-watch-dark" },
  critical: { bg: "bg-critical-light", text: "text-critical-dark" },
}

export interface StatusChipProps {
  variant: StatusVariant
  labelKey?: string
  children?: React.ReactNode
  className?: string
}

export default function StatusChip({
  variant,
  labelKey,
  children,
  className = "",
}: StatusChipProps) {
  const cfg = STATUS_CONFIG[variant]
  const label = children ?? (labelKey ? t(labelKey) : "")
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cfg.bg,
        cfg.text,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </span>
  )
}
