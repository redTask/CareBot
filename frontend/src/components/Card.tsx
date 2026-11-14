import React from "react"

// Base card used everywhere. White surface, 1px teal border at 25% opacity,
// soft navy-tinted shadow, hover lift. Nothing touches its neighbours.
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
        "bg-white rounded-2xl border border-line shadow-card transition-all duration-150",
        hoverable ? "hover:shadow-card-hover hover:border-teal/40" : "",
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
