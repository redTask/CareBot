import React from "react"

type BtnVariant = "primary" | "secondary" | "danger" | "ghost"
type BtnSize = "sm" | "md" | "lg"

const VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-[#2F6BFF] text-white hover:bg-[#1F55D6] shadow-sm",
  secondary:
    "bg-white border border-[#E6EBF2] text-[#0F172A] hover:bg-[#F5F7FA]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
  ghost: "text-[#475569] hover:bg-[#F1F4F9]",
}

const SIZES: Record<BtnSize, string> = {
  sm: "text-xs px-3 py-1.5 min-h-[36px]",
  md: "text-sm px-4 py-2.5 min-h-[44px]",
  lg: "text-base px-5 py-3 min-h-[48px]",
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
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none",
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
