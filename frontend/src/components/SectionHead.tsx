// Section heading: text-lg font-semibold in navy. Follow with gap-8 to the next
// section.
export default function SectionHead({
  title,
  caption,
}: {
  title: string
  caption?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h3 className="text-lg font-semibold font-heading text-navy">{title}</h3>
      {caption && <p className="text-xs font-semibold text-navy/70">{caption}</p>}
    </div>
  )
}
