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
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E6EBF2] bg-[#F8FAFC] px-4 py-8 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand">
        <Icon name={icon as any} size={20} />
      </span>
      <p className="text-sm font-semibold text-[#475569]">{title}</p>
      {hint && <p className="mt-1 text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  )
}
