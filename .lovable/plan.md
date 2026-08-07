Footer-Links aktualisieren

## Ziel
Die vier Footer-Links in `src/components/app/AppFooter.tsx` auf die neuen winfluence.net-Zielseiten umstellen.

## Änderungen
- `footer.imprint` → `https://winfluence.net/impressum`
- `footer.terms` → `https://winfluence.net/nutzungsbedingungen`
- `footer.privacy` → `https://winfluence.net/datenschutz`
- `footer.about` → `https://winfluence.net` (bisher `https://winfluence.net/about.html`)

## Technische Details
- Datei: `src/components/app/AppFooter.tsx`
- Keine weiteren Änderungen nötig; bestehende `target="_blank"` und `rel="noopener noreferrer"`-Logik für externe Links bleibt erhalten.
