import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiRequest } from "../lib/api"
import { useAppStore } from "../store/useStore"
import { t } from "../lib/i18n"
import Page from "../components/Page"
import Card from "../components/Card"
import Btn from "../components/Btn"
import Icon from "../components/Icon"

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
    <Page>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#EAF0FF] via-[#F1F4F9] to-[#E8F7EE] px-4 py-10">
        <div className="w-full max-w-sm">
          <Card padded={false} hoverable={false} className="p-6 sm:p-8 shadow-md">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
                <Icon name="heart-pulse" size={24} />
              </div>
              <h1 className="text-2xl font-semibold font-heading text-[#0F172A]">
                {t("app_name")}
              </h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                {t("tagline")}
              </p>
              <p className="mt-2 text-[10px] italic text-[#94A3B8]">
                {t("research_prototype")}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-[#FECACA] bg-critical-light px-3 py-2 text-sm text-critical-dark"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs font-semibold text-[#475569]"
                >
                  {t("email")}
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="w-full rounded-xl border border-[#E6EBF2] px-3 py-2.5 text-sm text-[#0F172A] outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-xs font-semibold text-[#475569]"
                >
                  {t("password")}
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="w-full rounded-xl border border-[#E6EBF2] px-3 py-2.5 text-sm text-[#0F172A] outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Btn type="submit" disabled={loading} className="w-full">
                {loading ? t("signing_in") : t("sign_in")}
              </Btn>
            </form>

            <div className="mt-6 border-t border-[#E6EBF2] pt-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                {t("demo_accounts")}
              </p>
              <div className="space-y-1.5">
                {[
                  { role: t("nurse"), account: "nurse@carebot.in / nurse123" },
                  { role: t("doctor"), account: "doctor@carebot.in / doctor123" },
                  { role: t("admin"), account: "admin@carebot.in / admin123" },
                ].map((demo) => (
                  <div
                    key={demo.account}
                    className="flex items-center justify-between gap-3 text-[10px] text-[#475569]"
                  >
                    <span className="font-semibold">{demo.role}</span>
                    <span className="font-mono text-[#94A3B8]">{demo.account}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
