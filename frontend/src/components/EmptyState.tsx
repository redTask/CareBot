import Icon from "./Icon"

export default function EmptyState({
  icon = "circle-check",
  title,
  hint,
  className = "",
}: {
  icon?: string
  title: string
  hint?: string
  className?: string
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-teal/30 bg-brand-tint px-4 py-8 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal">
        <Icon name={icon as any} size={20} />
      </span>
      <p className="text-sm font-semibold text-navy">{title}</p>
      {hint && <p className="mt-1 text-xs text-navy/60">{hint}</p>}
    </div>
  )
}
