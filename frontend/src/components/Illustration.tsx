import React from "react"

// Illness / get-well illustration. The one SVG allowed to exceed 32 px.
export default function Illustration({ className = "" }: { className?: string }) {
  return (
    <svg
      className={["illustration", "max-w-96", "h-auto", className].filter(Boolean).join(" ")}
      viewBox="0 0 440 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Patient recovering in bed"
      role="img"
    >
      <!-- ECG / pulse line -->
      <polyline
        points="250,135 280,135 295,105 310,160 325,135 355,135 385,135"
        stroke="#2F6BFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M390 125 L400 135 L390 145"
        stroke="#DC2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <!-- Bed -->
      <rect x="56" y="148" width="260" height="72" rx="14" fill="#FFFFFF" stroke="#E6EBF2" strokeWidth="2" />
      <rect x="42" y="196" width="24" height="16" rx="4" fill="#FFFFFF" stroke="#E6EBF2" strokeWidth="2" />
      <rect x="290" y="196" width="24" height="16" rx="4" fill="#FFFFFF" stroke="#E6EBF2" strokeWidth="2" />
      <!-- Pillow -->
      <rect x="70" y="130" width="80" height="26" rx="10" fill="#EAF0FF" stroke="#2F6BFF" strokeWidth="2" />
      <!-- Patient head -->
      <circle cx="112" cy="126" r="16" fill="#F5F7FA" stroke="#E6EBF2" strokeWidth="2" />
      <path
        d="M100 132 Q112 122 124 132"
        stroke="#CBD5E1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <!-- Blanket -->
      <rect x="88" y="156" width="156" height="56" rx="12" fill="#FFFFFF" stroke="#E6EBF2" strokeWidth="2" />
      <path
        d="M88 184 Q166 156 244 184"
        stroke="#2F6BFF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <!-- Thermometer -->
      <rect x="232" y="166" width="10" height="30" rx="5" fill="#FFFFFF" stroke="#E6EBF2" strokeWidth="2" />
      <rect x="234" y="180" width="6" height="14" rx="3" fill="#DC2626" />
    </svg>
  )
}
