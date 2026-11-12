import { useEffect, useState } from "react"

// Number change fade: remounts (and re-fades) whenever the value changes.
export default function AnimatedNumber({
  value,
  className = "",
}: {
  value: number | string
  className?: string
}) {
  const [text, setText] = useState(String(value))
  const [key, setKey] = useState(0)

  useEffect(() => {
    const next = String(value)
    if (next === text) return
    setKey((k) => k + 1)
    setText(next)
  }, [value, text])

  return (
    <span key={key} className={`animate-fade inline-block ${className}`}>
      {text}
    </span>
  )
}
