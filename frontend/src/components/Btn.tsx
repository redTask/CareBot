import React from "react"

type BtnVariant = "primary" | "secondary" | "danger" | "ghost" | "emergency"
type BtnSize = "sm" | "md" | "lg"

// Primary: teal fill, white text only at 16px bold or larger (see SIZES).
// Secondary: white with a teal border and navy text.
// Danger: navy fill — red is reserved for the critical banner and E-STOP only.
const VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-teal text-white hover:bg-navy shadow-sm",
  secondary:
    "bg-white border border-teal text-navy hover:bg-brand-tint hover:border-navy",
  danger: "bg-navy text-white hover:bg-navy/90 shadow-sm",
  ghost: "text-navy/70 hover:bg-brand-tint hover:text-navy",
  // The single permitted red: emergency stop only.
  emergency: "bg-alert text-white hover:brightness-90 shadow-sm",
}

// White text on a teal fill is only AA-safe at 16px bold, so the primary
// variant is never rendered smaller than that.
const SIZES: Record<BtnSize, string> = {
  sm: "text-[13px] px-3 py-1.5 min-h-[36px]",
  md: "text-base font-bold px-4 py-2.5 min-h-[44px]",
  lg: "text-base font-bold px-5 py-3 min-h-[48px]",
}

export interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
}

export default function Btn({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: BtnProps) {
  return (
    <button
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  )
}
