import { useTranslation } from "react-i18next";

export function AppFooter() {
  const { t } = useTranslation();
  const links = [
    { key: "footer.imprint", href: "#" },
    { key: "footer.terms", href: "#" },
    { key: "footer.privacy", href: "#" },
    { key: "footer.about", href: "https://winfluence.net/about.html" },
  ];
  return (
    <footer className="border-t bg-background px-6 py-3 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {links.map((l, i) => {
          const isExternal = l.href.startsWith("http");
          return (
            <span key={l.key} className="flex items-center gap-4">
              <a
                href={l.href}
                className="hover:text-foreground transition-colors"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
              >
                {t(l.key)}
              </a>
              {i < links.length - 1 ? <span className="opacity-40">|</span> : null}
            </span>
          );
        })}
      </div>
    </footer>
  );
}
