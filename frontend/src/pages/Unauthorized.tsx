import { useAppStore } from "../store/useStore"
import Icon from "../components/Icon"
import { t } from "../lib/i18n"
import Page from "../components/Page"
import Card from "../components/Card"

export default function Unauthorized() {
  const user = useAppStore((state) => state.user)

  return (
    <Page>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card hoverable={false} className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-critical-light text-critical-dark">
            <Icon name="shield" size={24} />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">{t("not_authorized")}</h1>
          <p className="mt-2 text-sm text-[#475569]">
            {t("signed_in_as")}{" "}
            <span className="font-semibold capitalize">{t(user?.role ?? "nurse")}</span>
            {t("requires_different_role")}
          </p>
          <button
            type="button"
            onClick={() => window.location.replace("/dashboard")}
            className="mt-6 min-h-[44px] w-full rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {t("back_to_dashboard_btn")}
          </button>
        </Card>
      </div>
    </Page>
  )
}
