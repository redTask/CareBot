import { useEffect, useState } from "react"
import { useAppStore } from "../store/useStore"
import { fetchAlerts, fetchTasks, fetchMedicationEvents } from "../lib/api"

function ImpactPage() {
  const { token } = useAppStore.getState()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        void (await fetchAlerts({ token }))
        void (await fetchTasks({ token }))
        void (await fetchMedicationEvents({ token }))
        setTimeout(() => setLoading(false), 1000)
      } catch (e) {
        setTimeout(() => setLoading(false), 1000)
      }
    }

    loadStats()
  }, [token])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Impact — 30 days</h2>
      <p>Impact stats placeholder</p>
    </div>
  )
}

export default ImpactPage