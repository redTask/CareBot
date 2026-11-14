import { useEffect, useState } from "react"
import { fetchAlerts, fetchTasks, fetchMedicationEvents } from "../lib/api"

function ImpactPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        await Promise.all([fetchAlerts(), fetchTasks(), fetchMedicationEvents()])
      } catch (e) {
        console.error("Failed to load impact stats", e)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="min-h-screen page-bg p-6">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-card">
        <h2 className="text-2xl font-bold text-navy">Impact — 30 days</h2>
        {loading ? (
          <p className="mt-2 text-sm font-semibold text-navy/70">Loading…</p>
        ) : (
          <p className="mt-2 text-sm font-medium text-navy/70">Impact stats placeholder</p>
        )}
      </div>
    </div>
  )
}

export default ImpactPage
