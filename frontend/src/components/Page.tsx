import React from "react"

// Page wrapper: the soft lime → white → mint gradient. Pages that need the
// measured container add max-w-7xl mx-auto px-6 py-6 themselves.
export default function Page({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen page-bg">{children}</div>
}
