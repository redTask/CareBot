import { create } from "zustand"
import { persist, devtools } from "zustand/middleware"

export type Role = "nurse" | "doctor" | "admin"

export interface User {
  id: number
  name: string
  email: string
  role: Role
}

export interface VitalReading {
  id: number
  patient_id: number
  robot_id: number | null
  type: string
  value: number
  quality: string
  timestamp: string
}

export interface Robot {
  id: number
  name: string
  status: string
  battery: number
  x: number
  y: number
  current_task_id: number | null
  last_seen: string
}

export interface BedPatient {
  id: number
  name: string
  age: number
  sex: string
  conditions: string
}

export interface LatestVital {
  type: string
  value: number
  quality: string
  timestamp: string
}

export interface Bed {
  id: number
  label: string
  x: number
  y: number
  patient: BedPatient | null
  latest_vital: LatestVital | null
  status: string
  last_checked: string | null
}

export interface Patient {
  id: number
  name: string
  age: number
  sex: string
  bed_id: number | null
  conditions: string
  care_plan: any | null
  medications: any[]
}

export interface Alert {
  id: number
  type: string
  severity: string
  patient_id: number | null
  robot_id: number | null
  message: string
  status: string
  created_at: string | null
  acknowledged_by: number | null
  acknowledged_at: string | null
  escalation_level: number
}

export interface Task {
  id: number
  type: string
  priority: string
  bed_id: number | null
  robot_id: number | null
  status: string
  created_by: number | null
  created_at: string | null
  updated_at: string | null
}

export interface MedicationEvent {
  id: number
  medication_id: number
  patient_id: number | null
  patient_name: string | null
  drug: string | null
  dose: string | null
  due_at: string | null
  status: string
  acknowledged_at: string | null
}

interface AppState {
  // Auth
  token: string | null
  user: User | null
  // Data
  beds: Bed[]
  robots: Robot[]
  patients: Record<number, Patient>
  latestVitals: Record<number, LatestVital>
  alerts: Alert[]
  tasks: Task[]
  medicationEvents: MedicationEvent[]
  // Connection
  online: boolean
  lastUpdated: string | null
  // Actions
  setAuth: (token: string, user: User) => void
  logout: () => void
  setBeds: (beds: Bed[]) => void
  setRobots: (robots: Robot[]) => void
  setPatient: (patient: Patient) => void
  upsertVital: (vital: VitalReading) => void
  upsertRobot: (robot: Robot) => void
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  updateAlert: (alert: Partial<Alert> & { id: number }) => void
  resolveAlert: (id: number) => void
  acknowledgeAlert: (id: number, acknowledgedBy: number | null) => void
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (task: Partial<Task> & { id: number }) => void
  setMedicationEvents: (events: MedicationEvent[]) => void
  addMedicationEvent: (event: MedicationEvent) => void
  updateMedicationEvent: (event: Partial<MedicationEvent> & { id: number }) => void
  setOnline: (online: boolean) => void
  setLastUpdated: (time: string | null) => void
  isAuthenticated: () => boolean
  hasRole: (role: Role) => boolean
  hasAnyRole: (...roles: Role[]) => boolean
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        user: null,
        beds: [],
        robots: [],
        patients: {},
        latestVitals: {},
        alerts: [],
        tasks: [],
        medicationEvents: [],
        online: false,
        lastUpdated: null,
        setAuth: (token, user) => set({ token, user }),
        logout: () => set({ token: null, user: null }),
        setBeds: (beds) => set({ beds, lastUpdated: new Date().toISOString() }),
        setRobots: (robots) => set({ robots }),
        setPatient: (patient) =>
          set((state) => ({
            patients: { ...state.patients, [patient.id]: patient },
          })),
        upsertVital: (vital) =>
          set((state) => {
            const latest = { ...state.latestVitals }
            latest[vital.patient_id] = {
              type: vital.type,
              value: vital.value,
              quality: vital.quality,
              timestamp: vital.timestamp,
            }
            return { latestVitals: latest, lastUpdated: new Date().toISOString() }
          }),
        upsertRobot: (robot) =>
          set((state) => {
            const robots = state.robots.map((r) =>
              r.id === robot.id ? robot : r
            )
            return { robots }
          }),
        setAlerts: (alerts) => set({ alerts }),
        addAlert: (alert) =>
          set((state) => {
            // Avoid duplicates.
            if (state.alerts.some((a) => a.id === alert.id)) return state
            return { alerts: [alert, ...state.alerts] }
          }),
        updateAlert: (patch) =>
          set((state) => ({
            alerts: state.alerts.map((a) =>
              a.id === patch.id ? { ...a, ...patch } : a
            ),
          })),
        resolveAlert: (id) =>
          set((state) => ({
            alerts: state.alerts.map((a) =>
              a.id === id ? { ...a, status: "resolved" } : a
            ),
          })),
        acknowledgeAlert: (id, acknowledgedBy) =>
          set((state) => ({
            alerts: state.alerts.map((a) =>
              a.id === id
                ? { ...a, status: "acknowledged", acknowledged_by: acknowledgedBy }
                : a
            ),
          })),
        setTasks: (tasks) => set({ tasks }),
        addTask: (task) =>
          set((state) => {
            if (state.tasks.some((t) => t.id === task.id)) return state
            return { tasks: [task, ...state.tasks] }
          }),
        updateTask: (patch) =>
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === patch.id ? { ...t, ...patch } : t
            ),
          })),
        setMedicationEvents: (events) => set({ medicationEvents: events }),
        addMedicationEvent: (event) =>
          set((state) => {
            if (state.medicationEvents.some((e) => e.id === event.id))
              return state
            return { medicationEvents: [event, ...state.medicationEvents] }
          }),
        updateMedicationEvent: (patch) =>
          set((state) => ({
            medicationEvents: state.medicationEvents.map((e) =>
              e.id === patch.id ? { ...e, ...patch } : e
            ),
          })),
        setOnline: (online) => set({ online }),
        setLastUpdated: (time) => set({ lastUpdated: time }),
        isAuthenticated: () => !!get().token,
        hasRole: (role: Role) => get().user?.role === role,
        hasAnyRole: (...roles: Role[]) =>
          roles.includes(get().user?.role as Role),
      }),
      {
        name: "carebot-auth",
        partialize: (state) => ({ token: state.token, user: state.user }),
      }
    )
  )
)
