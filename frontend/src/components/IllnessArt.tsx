import { useId } from "react"

export type IllnessKey =
  | "heart"
  | "lungs"
  | "diabetes"
  | "brain"
  | "kidney"
  | "default"

// Single lookup used by every patient card / detail page. First matching
// condition wins, case-insensitive keyword match.
const CONDITION_MAP: Array<[IllnessKey, string[]]> = [
  ["heart", ["heart", "hypertension", "cardiac", "arrhythmia", "bp"]],
  ["lungs", ["asthma", "copd", "lung", "respiratory", "pneumonia", "bronch"]],
  ["diabetes", ["diabetes", "diabetic", "glucose", "sugar"]],
  ["brain", ["stroke", "parkinson", "brain", "epilep", "migraine", "neuro"]],
  ["kidney", ["kidney", "renal", "dialysis", "thyroid"]],
]

export function illnessForConditions(conditions?: string | null): IllnessKey {
  if (!conditions) return "default"
  const haystack = conditions.toLowerCase()
  for (const [kind, keywords] of CONDITION_MAP) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return kind
  }
  return "default"
}

export const ILLNESS_LABEL_KEY: Record<IllnessKey, string> = {
  heart: "condition_heart",
  lungs: "condition_lungs",
  diabetes: "condition_diabetes",
  brain: "condition_brain",
  kidney: "condition_kidney",
  default: "condition_general",
}

export function IllnessArt({
  kind,
  className = "",
  animated = true,
  decorative = false,
}: {
  kind: IllnessKey
  className?: string
  animated?: boolean
  decorative?: boolean
}) {
  const uid = useId().replace(/:/g, "")
  const gradId = `illness-${uid}`
  const animation = animated ? "" : "[&_*]:!animate-none"

  return (
    <svg
      viewBox="0 0 240 200"
      className={["h-auto w-full", animation, className].filter(Boolean).join(" ")}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : kind}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#51E4BA" />
          <stop offset="100%" stopColor="#149DA5" />
        </linearGradient>
      </defs>

      {kind === "heart" && (
        <g>
          <ellipse cx="120" cy="104" rx="88" ry="76" fill="#CFF6EA" opacity="0.6" />
          <g className="illness-heartbeat" style={{ transformOrigin: "120px 100px" }}>
            <path
              d="M120 162s-62-36-62-80a34 34 0 0 1 62-19 34 34 0 0 1 62 19c0 44-62 80-62 80Z"
              fill={`url(#${gradId})`}
              opacity="0.9"
            />
            <path
              d="M96 96h14l8-18 10 34 8-16h12"
              fill="none"
              stroke="#254262"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <polyline
            points="58,60 82,60 90,48 98,72 106,60 182,60"
            fill="none"
            stroke="#51E4BA"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="illness-trace"
          />
        </g>
      )}

      {kind === "lungs" && (
        <g>
          <ellipse cx="120" cy="104" rx="86" ry="74" fill="#CFF6EA" opacity="0.6" />
          <path d="M120 62v66" stroke="#254262" strokeWidth="6" strokeLinecap="round" />
          <g className="illness-breathe" style={{ transformOrigin: "120px 96px" }}>
            <path
              d="M112 74c-10 6-16 18-26 24-12 7-18 20-14 34 4 15 20 22 32 15 9-5 12-16 12-27V80c0-7-1-8-4-6Z"
              fill={`url(#${gradId})`}
              opacity="0.85"
            />
            <path
              d="M128 74c10 6 16 18 26 24 12 7 18 20 14 34-4 15-20 22-32 15-9-5-12-16-12-27V80c0-7 1-8 4-6Z"
              fill={`url(#${gradId})`}
              opacity="0.85"
            />
          </g>
          <path d="M120 62v-10" stroke="#254262" strokeWidth="6" strokeLinecap="round" />
        </g>
      )}

      {kind === "diabetes" && (
        <g>
          <ellipse cx="120" cy="104" rx="84" ry="74" fill="#CFF6EA" opacity="0.6" />
          <g className="illness-drip" style={{ transformOrigin: "120px 110px" }}>
            <path
              d="M120 52c0 0 34 40 34 62a34 34 0 1 1-68 0c0-22 34-62 34-62Z"
              fill={`url(#${gradId})`}
              opacity="0.9"
            />
            <path
              d="M132 122a14 14 0 0 1-12 14"
              stroke="#254262"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          <g stroke="#51E4BA" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M52 150a70 70 0 0 1 136 0" />
            <path d="M120 150l16-22" stroke="#149DA5" className="illness-gauge" />
          </g>
        </g>
      )}

      {kind === "brain" && (
        <g>
          <ellipse cx="120" cy="104" rx="86" ry="74" fill="#CFF6EA" opacity="0.6" />
          <g className="illness-glow" style={{ transformOrigin: "120px 100px" }}>
            <path
              d="M92 66c-14 4-22 18-18 30-10 8-10 24 2 30-2 12 8 22 20 20 6 10 20 12 28 4 10 8 24 4 28-6 12-2 18-14 12-24 4-12-4-24-16-24-2-14-16-22-28-16-6-8-20-10-28-4Z"
              fill={`url(#${gradId})`}
              opacity="0.85"
            />
          </g>
          <g stroke="#254262" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M120 72v62" />
            <path d="M96 92c8 0 12 6 12 14s6 14 12 14" />
            <path d="M144 92c-8 0-12 6-12 14s-6 14-12 14" />
          </g>
        </g>
      )}

      {kind === "kidney" && (
        <g>
          <ellipse cx="120" cy="104" rx="84" ry="74" fill="#CFF6EA" opacity="0.6" />
          <g className="illness-breathe" style={{ transformOrigin: "120px 104px" }}>
            <path
              d="M86 60c-20 6-30 30-24 54 6 24 24 38 40 30 14-8 12-28 6-44-5-14-8-34-22-40Z"
              fill={`url(#${gradId})`}
              opacity="0.85"
            />
            <path
              d="M154 60c20 6 30 30 24 54-6 24-24 38-40 30-14-8-12-28-6-44 5-14 8-34 22-40Z"
              fill={`url(#${gradId})`}
              opacity="0.85"
            />
          </g>
          <path d="M120 84v44" stroke="#254262" strokeWidth="6" strokeLinecap="round" />
        </g>
      )}

      {kind === "default" && (
        <g>
          <ellipse cx="120" cy="104" rx="84" ry="74" fill="#CFF6EA" opacity="0.6" />
          <g className="illness-breathe" style={{ transformOrigin: "120px 100px" }}>
            <rect x="104" y="52" width="32" height="96" rx="12" fill={`url(#${gradId})`} opacity="0.9" />
            <rect x="72" y="84" width="96" height="32" rx="12" fill={`url(#${gradId})`} opacity="0.9" />
          </g>
        </g>
      )}
    </svg>
  )
}

export function IllnessIcon({
  kind,
  size = 28,
  className = "",
}: {
  kind: IllnessKey
  size?: number
  className?: string
}) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full bg-brand-tint",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size + 10, height: size + 10 }}
      aria-hidden="true"
    >
      <IllnessArt kind={kind} decorative className="block" />
    </span>
  )
}
