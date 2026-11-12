import React from "react"

// Page wrapper: background #F1F4F9. Pages that need the measured container
// add max-w-7xl mx-auto px-6 py-6 themselves.
export default function Page({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F1F4F9]">{children}</div>
}
