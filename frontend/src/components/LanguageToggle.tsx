import { useState } from "react"
import { useAppStore } from "../store/useStore"
import { getLang, setLang, t } from "../lib/i18n"

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
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={lang === "ml" ? "ml-font" : ""}>
          {lang === "ml" ? "മലയാളം" : "English"}
        </span>
        <span className="text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <button
            onClick={() => handleSelect("en")}
            className={`w-full text-left px-3 py-2 text-sm ${
              lang === "en" ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleSelect("ml")}
            className={`w-full text-left px-3 py-2 text-sm ${
              lang === "ml" ? "bg-blue-50 text-blue-600 font-semibold ml-font" : "text-gray-700 hover:bg-gray-100 ml-font"
            }`}
          >
            മലയാളം
          </button>
        </div>
      )}
    </div>
  )
}
