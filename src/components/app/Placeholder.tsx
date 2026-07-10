import { useTranslation } from "react-i18next";

export function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("common.comingSoon")}</p>
    </div>
  );
}
