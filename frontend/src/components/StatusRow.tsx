import { t } from "../lib/i18n"
import Icon from "./Icon"

// Status is always shown as icon + colour + text, never colour alone.
type StatusVariant = "normal" | "watch" | "critical"

const STATUS_CONFIG: Record<
  StatusVariant,
  { dot: string; text: string; icon: string; labelKey: string }
> = {
  normal: {
    dot: "bg-lime",
    text: "text-navy",
    icon: "circle-check",
    labelKey: "status_normal",
  },
  watch: {
    dot: "bg-teal",
    text: "text-navy",
    icon: "alert-circle",
    labelKey: "status_watch",
  },
  critical: {
    dot: "bg-navy",
    text: "text-navy font-bold",
    icon: "alert-triangle",
    labelKey: "status_critical",
  },
}

export interface StatusRowProps {
  variant: StatusVariant
  labelKey?: string
  children?: React.ReactNode
  className?: string
  iconSize?: 16 | 20 | 24
}

export default function StatusRow({
  variant,
  labelKey,
  children,
  className = "",
  iconSize = 16,
}: StatusRowProps) {
  const cfg = STATUS_CONFIG[variant]
  const label = children ?? (labelKey ? t(labelKey) : t(cfg.labelKey))
  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      <Icon name={cfg.icon as any} size={iconSize} className={cfg.text} aria-hidden="true" />
      <span className={`text-xs font-medium ${cfg.text}`}>{label}</span>
    </div>
  )
}
