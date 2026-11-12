import React from "react"

// Base card used everywhere. White, rounded-2xl, border #E6EBF2, shadow-sm,
// hover lift to shadow-md over 150ms. Nothing touches its neighbours.
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  padded?: boolean
  hoverable?: boolean
  asChild?: boolean
}

export default function Card({
  className = "",
  padded = true,
  hoverable = true,
  children,
}: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-2xl border border-[#E6EBF2] shadow-sm transition-all duration-150",
        hoverable ? "hover:shadow-md hover:-translate-y-1" : "",
        padded ? "p-5" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  )
}
