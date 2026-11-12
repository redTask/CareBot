import React from "react"

// Section heading: text-lg font-semibold. Follow with gap-8 to the next section.
export default function SectionHead({
  title,
  caption,
}: {
  title: string
  caption?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <h3 className="text-lg font-semibold font-heading text-[#0F172A]">{title}</h3>
      {caption && <p className="text-xs text-[#94A3B8]">{caption}</p>}
    </div>
  )
}
