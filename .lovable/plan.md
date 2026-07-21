Plan: /profile Navigation anpassen

1. Back-Button oberhalb des Titels
   - Datei: `src/routes/_authenticated/profile.tsx`
   - Import: `useRouter` aus `@tanstack/react-router`, `ChevronLeft` aus `lucide-react`.
   - Oberhalb von `<h1 className="text-2xl ...">` einen Link/Button einfügen: `← Zurück`.
   - Bei Klick: `router.history.back()` (echter Browser-Back).
   - Text aus bestehendem `common.back` (de: "Zurück").

2. Weiterleitung nach erfolgreichem Speichern
   - In `src/routes/_authenticated/profile.tsx` `useNavigate` aus `@tanstack/react-router` importieren.
   - Nach `toast.success(t("profile.saved"))` und Query-Invalidierung `navigate({ to: "/" })` aufrufen, um auf das Dashboard weiterzuleiten.

Keine Schema- oder Cloud-Änderungen. Keine neuen Abhängigkeiten.