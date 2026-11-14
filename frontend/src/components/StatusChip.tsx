import { t } from "../lib/i18n"
import Icon from "./Icon"

// Status pill. Always icon + colour + label — never colour alone.
//   Normal   lime fill, navy text, check-circle
//   Watch    teal fill, white bold text (>=16px bold), alert-circle
//   Critical navy fill, thick border, white bold text, alert-triangle,
//            soft pulsing ring (the ring is the one allowed red usage here).
type StatusVariant = "normal" | "watch" | "critical"

const STATUS_CONFIG: Record<
  StatusVariant,
  { badge: string; icon: string; labelKey: string }
> = {
  normal: {
    badge: "bg-lime text-navy",
    icon: "circle-check",
    labelKey: "status_normal",
  },
  watch: {
    badge: "bg-teal text-white text-base font-bold",
    icon: "alert-circle",
    labelKey: "status_watch",
  },
  critical: {
    badge: "bg-navy text-white text-base font-bold border-2 border-white animate-ring",
    icon: "alert-triangle",
    labelKey: "status_critical",
  },
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
  const label = children ?? (labelKey ? t(labelKey) : t(cfg.labelKey))
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
        cfg.badge,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon name={cfg.icon as any} size={16} />
      {label}
    </span>
  )
}

export { STATUS_CONFIG as STATUS_CHIP_CONFIG }
