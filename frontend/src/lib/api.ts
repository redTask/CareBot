import { useAppStore } from "../store/useStore"

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
export const WS_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/^http/, "ws")

function headers(token: string | null, extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {}
  if (token) h["Authorization"] = `Bearer ${token}`
  return { ...h, ...extra }
}

export async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers(token), ...options.headers },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(body || `Request failed: ${res.status}`)
  }
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) return res.json()
  return res.text()
}

export async function fetchBeds() {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/beds`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch beds failed: ${res.status}`)
  return res.json()
}

export async function fetchRobots() {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/robots`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch robots failed: ${res.status}`)
  return res.json()
}

export async function fetchPatient(patientId: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/patients/${patientId}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch patient failed: ${res.status}`)
  return res.json()
}

export async function fetchVitals(patientId: number, range: "1h" | "24h", limit = 400) {
  const { token } = useAppStore.getState()
  const qs = new URLSearchParams({
    patient_id: String(patientId),
    range,
    limit: String(limit),
  })
  const res = await fetch(`${API_BASE}/vitals?${qs}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch vitals failed: ${res.status}`)
  return res.json()
}

export async function clearOldTasks() {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/tasks/old`, {
    method: "DELETE",
    headers: headers(token),
  })
  if (!res.ok) throw new Error(`clear tasks failed: ${res.status}`)
  return res.json()
}

export async function fetchAlerts(params?: Record<string, string | number>) {
  const { token } = useAppStore.getState()
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""
  const res = await fetch(`${API_BASE}/alerts${qs}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch alerts failed: ${res.status}`)
  return res.json()
}

export async function acknowledgeAlert(alertId: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`acknowledge alert failed: ${res.status}`)
  return res.json()
}

export async function fetchTasks(params?: Record<string, string | number>) {
  const { token } = useAppStore.getState()
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""
  const res = await fetch(`${API_BASE}/tasks${qs}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch tasks failed: ${res.status}`)
  return res.json()
}

export async function createTask(body: { type: string; priority: string; bed_id?: number }) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`create task failed: ${res.status}`)
  return res.json()
}

export async function cancelTask(taskId: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/tasks/${taskId}/cancel`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`cancel task failed: ${res.status}`)
  return res.json()
}

export async function completeTask(taskId: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/tasks/${taskId}/complete`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`complete task failed: ${res.status}`)
  return res.json()
}

export async function assignTask(taskId: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/tasks/${taskId}/assign`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`assign task failed: ${res.status}`)
  return res.json()
}

export async function fetchAuditLogs() {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/audit`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch audit logs failed: ${res.status}`)
  return res.json()
}

export async function fetchMedicationEvents(params?: Record<string, string | number>) {
  const { token } = useAppStore.getState()
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : ""
  const res = await fetch(`${API_BASE}/medication-events${qs}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch medication events failed: ${res.status}`)
  return res.json()
}

export async function acknowledgeMedicationEvent(eventId: number, acknowledgedBy: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/medication-events/${eventId}/acknowledge`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ acknowledged_by: acknowledgedBy }),
  })
  if (!res.ok) throw new Error(`acknowledge medication failed: ${res.status}`)
  return res.json()
}

export async function markMedicationEventMissed(eventId: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/medication-events/${eventId}/missed`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`mark medication missed failed: ${res.status}`)
  return res.json()
}

export async function fetchCarePlan(patientId: number) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/care-plans/${patientId}`, { headers: headers(token) })
  if (!res.ok) throw new Error(`fetch care plan failed: ${res.status}`)
  return res.json()
}

export async function updateCarePlan(patientId: number, body: { notes?: string; thresholds?: any }) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/care-plans/${patientId}`, {
    method: "PUT",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`update care plan failed: ${res.status}`)
  return res.json()
}

export async function createVital(reading: any) {
  const { token } = useAppStore.getState()
  const res = await fetch(`${API_BASE}/vitals`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify(reading),
  })
  if (!res.ok) throw new Error(`create vital failed: ${res.status}`)
  return res.json()
}
