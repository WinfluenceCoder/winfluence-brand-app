Ziel: In `/profile` wird rechts neben jedem URL-Feld ein "Link out"-Icon angezeigt. Bei Klick öffnet sich die eingegebene URL in einem neuen Tab/Fenster. Das Icon ist disabled, wenn das Feld leer ist oder keine gültige URL (beginnend mit `http://` oder `https://`) enthält.

Betroffene Felder:
- `linkedin_url`
- `insta_url`
- `youtube_url`
- `tiktok_url`
- `user_linkedin_url`

Änderungen:

1. **Neue Hilfskomponente `UrlInputWithLink`** in `src/components/app/UrlInputWithLink.tsx`:
   - Props: `id`, `value`, `error`, `placeholder`, `registration` (oder `field`-Props für react-hook-form), `aria-invalid`, `className`.
   - Rendert ein `Input` plus einen `Button` (Icon-Button) mit `variant="ghost"` und `size="icon"` direkt rechts daneben im selben flex-Container.
   - Icon: `ExternalLink` aus `lucide-react`.
   - OnClick: `window.open(value, "_blank", "noopener,noreferrer")`.
   - Disabled-Zustand: `disabled={!value || !/^https?:\/\//i.test(value)}`.
   - Barrierefreiheit: `aria-label="Link öffnen"`, `type="button"`, damit das Formular nicht abgeschickt wird.

2. **Integration in `src/routes/_authenticated/profile.tsx`**:
   - Import von `UrlInputWithLink` hinzufügen.
   - Die fünf URL-Eingabefelder (`linkedin_url`, `insta_url`, `youtube_url`, `tiktok_url`, `user_linkedin_url`) ersetzen durch die neue Komponente.
   - Fehler- und Label-Darstellung bleibt unverändert; das Icon-Button-Layout wird innerhalb der bestehenden `grid gap-2`-Wrapper eingebettet.
   - Für `insta_url`: Da das Feld derzeit `@brand` als Placeholder hat und schemalose URL-Validierung besitzt, wird das Icon weiterhin nur bei einer vollständigen `http(s)://`-URL aktiviert. Die Anforderung "keine gültige URL" bleibt damit konsistent.

3. **Lokalisierung**:
   - Neuer Key `profile.openLink` mit dem Wert "Link öffnen" in `src/locales/de.json` hinzufügen, damit das `aria-label` übersetzt bleibt.

4. **Validierung**:
   - Es wird keine zusätzliche Validierungslogik eingeführt. Die URL-Prüfung im Icon verwendet denselben einfachen Regex (`/^https?:\/\//i`), der auch im Zod-Schema (`urlOpt`) für die meisten URL-Felder genutzt wird.

Technische Details:
- Kein Backend- oder Schema-Change.
- Keine Cloud-Funktionalität.
- Styling mit Tailwind-Utility-Klassen; Icon-Button verwendet die bestehenden `Button`-Varianten.
- Die Komponente bleibt client-seitig und wird in der SSR-Route wie alle anderen Formularfelder lazy-hydratisiert.