import { getLang, setLang } from "../lib/i18n"

export default function LanguageToggle() {
  const lang = getLang()

  const option = (value: "en" | "ml", label: string) => (
    <button
      type="button"
      onClick={() => lang !== value && setLang(value)}
      aria-pressed={lang === value}
      className={[
        "min-h-[32px] rounded-full px-2.5 text-xs font-semibold transition-colors duration-150",
        lang === value
          ? "bg-white text-[#1F55D6] shadow-sm"
          : "text-[#64748B] hover:text-[#0F172A]",
        value === "ml" ? "ml-font" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </button>
  )

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full bg-[#F1F4F9] p-0.5"
      role="group"
      aria-label="Language"
    >
      {option("en", "EN")}
      {option("ml", "മലയാളം")}
    </div>
  )
}
