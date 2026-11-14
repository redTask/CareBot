import { useAppStore } from "../store/useStore"
import { t } from "../lib/i18n"
import Icon from "./Icon"
import LanguageToggle from "./LanguageToggle"
import EStopButton from "./EStopButton"
import PatientAvatar from "./PatientAvatar"

type NavKey = "dashboard" | "tasks" | "alerts" | "audit"

// Header: solid black bar so it stays distinct from the green page background,
// white text, teal accent for the active item.
export default function AppHeader({ active = "dashboard" }: { active?: NavKey }) {
  const user = useAppStore((state) => state.user)
  const online = useAppStore((state) => state.online)

  const links: Array<{ key: NavKey; href: string; label: string }> = [
    { key: "dashboard", href: "/dashboard", label: t("nav_dashboard") },
    { key: "tasks", href: "/dashboard#tasks", label: t("nav_tasks") },
    { key: "alerts", href: "/dashboard#alerts", label: t("nav_alerts") },
  ]
  if (user?.role === "admin") {
    links.push({ key: "audit", href: "/admin/audit", label: t("nav_audit") })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black shadow-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white">
            <Icon name="heart-pulse" size={20} />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            {t("app_name")}
          </span>
        </a>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              aria-current={active === link.key ? "page" : undefined}
              className={[
                "rounded-xl px-3 py-2 text-base font-bold transition-colors duration-150",
                active === link.key
                  ? "bg-teal text-white"
                  : "text-white/80 font-semibold hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white lg:inline-flex"
            title={online ? t("connected") : t("offline")}
          >
            <span
              className={`h-2 w-2 rounded-full ${online ? "bg-lime" : "bg-alert"}`}
              aria-hidden="true"
            />
            {online ? t("connected") : t("offline")}
          </span>

          <LanguageToggle />

          {user && (
            <span className="hidden items-center gap-2 rounded-full border border-white/20 py-1 pl-1 pr-3 xl:inline-flex">
              <PatientAvatar name={user.name} size={28} />
              <span className="leading-tight">
                <span className="block max-w-[120px] truncate text-xs font-semibold text-white">
                  {user.name}
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-mint">
                  {t(user.role)}
                </span>
              </span>
            </span>
          )}

          <EStopButton />
        </div>
      </div>
    </header>
  )
}
