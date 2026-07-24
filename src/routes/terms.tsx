import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "AGB — Winfluence BrandApp" },
      { name: "description", content: "Allgemeine Geschäftsbedingungen der Winfluence BrandApp." },
      { property: "og:title", content: "AGB — Winfluence BrandApp" },
      { property: "og:description", content: "Allgemeine Geschäftsbedingungen der Winfluence BrandApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("terms.title")}</h1>
      <p className="text-sm text-muted-foreground">{t("terms.placeholder")}</p>
    </div>
  );
}
