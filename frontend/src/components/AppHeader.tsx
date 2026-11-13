import { useAppStore } from "../store/useStore"
import { t } from "../lib/i18n"
import Icon from "./Icon"
import LanguageToggle from "./LanguageToggle"
import EStopButton from "./EStopButton"
import PatientAvatar from "./PatientAvatar"

type NavKey = "dashboard" | "tasks" | "alerts" | "audit"

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
    <header className="sticky top-0 z-40 border-b border-[#E6EBF2] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a href="/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand">
            <Icon name="heart-pulse" size={20} />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-[#0F172A]">
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
                "rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-150",
                active === link.key
                  ? "bg-brand-tint text-[#1F55D6]"
                  : "text-[#475569] hover:bg-[#F1F4F9] hover:text-[#0F172A]",
              ].join(" ")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span
            className="hidden items-center gap-1.5 rounded-full bg-[#F1F4F9] px-2.5 py-1 text-xs font-semibold text-[#475569] lg:inline-flex"
            title={online ? t("connected") : t("offline")}
          >
            <span
              className={`h-2 w-2 rounded-full ${online ? "bg-normal-dark" : "bg-critical-dark"}`}
              aria-hidden="true"
            />
            {online ? t("connected") : t("offline")}
          </span>

          <LanguageToggle />

          {user && (
            <span className="hidden items-center gap-2 rounded-full border border-[#E6EBF2] py-1 pl-1 pr-3 xl:inline-flex">
              <PatientAvatar name={user.name} size={28} />
              <span className="leading-tight">
                <span className="block max-w-[120px] truncate text-xs font-semibold text-[#0F172A]">
                  {user.name}
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-[#94A3B8]">
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
