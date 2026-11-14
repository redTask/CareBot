import { useMemo } from "react"
import { createAvatar } from "@dicebear/core"
import { initials } from "@dicebear/collection"

// Deterministic initials avatar per patient. Purely decorative: the patient
// name is always rendered alongside, so the image is hidden from screen readers.
export default function PatientAvatar({
  name,
  size = 40,
  className = "",
}: {
  name: string
  size?: number
  className?: string
}) {
  const src = useMemo(
    () =>
      createAvatar(initials, {
        seed: name,
        chars: 2,
        backgroundColor: ["51E4BA"],
        textColor: ["254262"],
        fontFamily: ["Inter"],
        fontWeight: 700,
        fontSize: 40,
      }).toDataUri(),
    [name]
  )

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={[
        "rounded-full border border-line bg-brand-tint shrink-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  )
}
