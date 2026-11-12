import { useAppStore } from "../store/useStore"
import { t } from "../lib/i18n"

export default function Unauthorized() {
  const user = useAppStore((state) => state.user)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 sm:p-10">
      <div className="bg-white rounded-3xl shadow border border-gray-200 p-10 w-full max-w-sm sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FDE8E8] flex items-center justify-center text-[#DC2626] text-2xl font-bold mx-auto mb-6">
          <Icon name="alert-circle" size={24} className="text-[#DC2626]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("not_authorized")}</h2>
        <p className="text-gray-600 text-sm mb-6">
          {t("signed_in_as")} <span className="font-semibold capitalize">{t(user?.role ?? "nurse")}</span>{t("requires_different_role")}
        </p>
        <button
          onClick={() => window.location.replace("/dashboard")}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          {t("back_to_dashboard_btn")}
        </button>
      </div>
    </div>
  )
}
