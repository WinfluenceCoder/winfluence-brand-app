import { useTranslation } from "react-i18next";

export function AppFooter() {
  const { t } = useTranslation();
  const links = [
    { key: "footer.imprint" },
    { key: "footer.terms" },
    { key: "footer.privacy" },
    { key: "footer.about" },
  ];
  return (
    <footer className="border-t bg-background px-6 py-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {links.map((l, i) => (
          <span key={l.key} className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">
              {t(l.key)}
            </a>
            {i < links.length - 1 ? <span className="opacity-40">|</span> : null}
          </span>
        ))}
      </div>
    </footer>
  );
}
