import { useEffect } from "react"
import { BrowserRouter } from "react-router-dom"
import { useAppStore } from "./store/useStore"
import RoutesComponent from "./routes"
import { API_BASE } from "./lib/api"
import { connectWS, disconnectWS } from "./lib/ws"
import { initLang } from "./lib/i18n"

export default function App() {
  const { isAuthenticated, user, setAuth, logout } = useAppStore.getState()
  const token = useAppStore((state) => state.token)

  useEffect(() => {
    // Initialize language from localStorage
    initLang()

    // Restore the user from the server when we have a token but no user
    if (isAuthenticated() && !user && token) {
      fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("session restore failed")
          }
          return res.json()
        })
        .then((userData: any) => setAuth(token, userData))
        .catch(() => {
          logout()
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // One live socket for the whole app, so every page shows the true
  // connection status and receives live vitals/alerts.
  useEffect(() => {
    if (!token) return
    connectWS(API_BASE.replace(/^http/, "ws"), token)
    return () => disconnectWS()
  }, [token])

  return (
    <BrowserRouter>
      <RoutesComponent />
    </BrowserRouter>
  )
}
