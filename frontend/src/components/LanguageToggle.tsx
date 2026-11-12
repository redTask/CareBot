import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { getLang, setLang, t } from "../lib/i18n"
import Icon from "./Icon"

export default function LanguageToggle() {
  const lang = getLang()
  const [open, setOpen] = useState(false)

  const handleSelect = (l: "en" | "ml") => {
    setLang(l)
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E6EBF2] bg-white text-sm font-medium text-[#0F172A] hover:bg-[#F5F7FA] transition-all duration-150"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={lang === "ml" ? "ml-font" : ""}>
          {lang === "ml" ? "മലയാളം" : "English"}
        </span>
        <Icon name="chevron-down" size={16} className="text-[#94A3B8]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E6EBF2] rounded-2xl shadow-lg py-1.5 z-50">
          <button
            onClick={() => handleSelect("en")}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors duration-150 ${
              lang === "en"
                ? "bg-brand-tint text-[#1F55D6] font-semibold"
                : "text-[#475569] hover:bg-[#F1F4F9]"
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleSelect("ml")}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors duration-150 ${
              lang === "ml"
                ? "bg-brand-tint text-[#1F55D6] font-semibold ml-font"
                : "text-[#475569] hover:bg-[#F1F4F9] ml-font"
            }`}
          >
            മലയാളം
          </button>
        </div>
      )}
    </div>
  )
}
