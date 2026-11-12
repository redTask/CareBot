import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest } from "../lib/api"
import { useAppStore } from "../store/useStore"
import { t } from "../lib/i18n"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAppStore((state) => state.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const form = new FormData()
      form.append("username", email)
      form.append("password", password)
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: form,
      })
      setAuth(data.access_token, {
        id: data.user_id,
        name: data.user_name ?? email,
        email,
        role: data.role,
      })
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.message || t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
            CB
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{t("app_name")}</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">
            {t("tagline")}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5 italic">{t("research_prototype")}</p>
        </div>

        {error && (
          <div className="p-2 rounded text-sm text-red-800 bg-red-50 border border-red-100 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("email")}</label>
            <input
              type="email"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t("password")}</label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {loading ? t("signing_in") : t("sign_in")}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider font-medium">
            {t("demo_accounts")}
          </p>
          <div className="space-y-1">
            <div className="text-[10px] text-gray-600 flex justify-between">
              <span className="font-medium">{t("nurse")}</span>
              <span className="text-gray-500">nurse@carebot.in / nurse123</span>
            </div>
            <div className="text-[10px] text-gray-600 flex justify-between">
              <span className="font-medium">{t("doctor")}</span>
              <span className="text-gray-500">doctor@carebot.in / doctor123</span>
            </div>
            <div className="text-[10px] text-gray-600 flex justify-between">
              <span className="font-medium">{t("admin")}</span>
              <span className="text-gray-500">admin@carebot.in / admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
