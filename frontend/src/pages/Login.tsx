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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-lime/25 via-white to-mint/20 px-4 py-10">
        <div className="w-full max-w-sm">
          <Card padded={false} hoverable={false} className="p-6 sm:p-8 shadow-md">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-white">
                <Icon name="heart-pulse" size={24} />
              </div>
              <h1 className="text-2xl font-semibold font-heading text-navy">
                {t("app_name")}
              </h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-navy/60">
                {t("tagline")}
              </p>
              <p className="mt-2 text-[10px] text-navy/60">
                {t("research_prototype")}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border-2 border-navy bg-navy/[0.06] px-3 py-2 text-sm font-semibold text-navy"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-1.5 block text-xs font-semibold text-navy/70"
                >
                  {t("email")}
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="w-full rounded-xl border border-line px-3 py-2.5 text-sm text-navy outline-none transition-all duration-150 focus:border-teal focus:ring-2 focus:ring-teal/25"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label
                  htmlFor="login-password"
                  className="mb-1.5 block text-xs font-semibold text-navy/70"
                >
                  {t("password")}
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="w-full rounded-xl border border-line px-3 py-2.5 text-sm text-navy outline-none transition-all duration-150 focus:border-teal focus:ring-2 focus:ring-teal/25"
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

            <div className="mt-6 border-t border-line pt-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-navy/60">
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
                    className="flex items-center justify-between gap-3 text-[10px] text-navy/70"
                  >
                    <span className="font-semibold">{demo.role}</span>
                    <span className="font-mono text-navy/60">{demo.account}</span>
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
