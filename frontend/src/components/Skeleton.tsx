export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-2xl border border-[#E6EBF2] bg-white p-5",
        className,
      ].join(" ")}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-full bg-[#E6EBF2]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[#E6EBF2]" />
          <div className="h-3 w-1/3 rounded bg-[#F1F4F9]" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="h-16 rounded-xl bg-[#F1F4F9]" />
        <div className="h-16 rounded-xl bg-[#F1F4F9]" />
        <div className="h-16 rounded-xl bg-[#F1F4F9]" />
      </div>
      <div className="mt-4 h-3 w-1/2 rounded bg-[#F1F4F9]" />
    </div>
  )
}

export function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={["animate-pulse rounded-2xl border border-[#E6EBF2] bg-white p-5", className].join(
        " "
      )}
      aria-hidden="true"
    >
      <div className="mb-4 h-4 w-1/3 rounded bg-[#E6EBF2]" />
      <div className="h-52 rounded-xl bg-[#F1F4F9]" />
    </div>
  )
}
