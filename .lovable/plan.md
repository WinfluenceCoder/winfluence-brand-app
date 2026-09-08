# Winfluence-Logo durch neues Logo ersetzen

## Ziel
Das bestehende Winfluence-Logo (`src/assets/winfluence-logo.png`) wird durch das neu hochgeladene Logo ersetzt. Alle Stellen, die das Logo einbinden, zeigen danach automatisch die neue Grafik.

## Änderungen

1. **Datei ersetzen**: Das hochgeladene `logo.png` wird nach `src/assets/winfluence-logo.png` kopiert (gleicher Dateiname, bestehender Import-Mechanismus bleibt). Kein Code-Change nötig.
2. **Betroffene Stellen** (zeigen danach automatisch das neue Logo):
   - Sidebar (`AppSidebar.tsx`)
   - `/login`, `/welcome`, `/reset-password`, `/set-password`, `/signed-out`
   - Öffentliche Kampagnen-Preview (`/campaigns/preview/$id`)
3. **Favicon prüfen**: Das Favicon in `public/` wird aus dem neuen Logo-Mark (das rote Spark-Symbol) neu generiert (64×64, quadratisch, mit Padding), damit es zum neuen Branding passt.

## Nicht angefasst

- `winfluence-icon.png` (zugeklappte Sidebar) bleibt unverändert — das neue Logo enthält kein separates „W"-Icon; falls gewünscht, kann das Spark-Symbol daraus extrahiert werden (separater Wunsch).
- Keine Schema-, Backend- oder Layout-Änderungen.
