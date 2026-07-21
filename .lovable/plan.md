Ziel: In der Kachel „Meine Kampagnen“ auf `/` jede Tabellenzeile mit einem kleinen, quadratischen Vorschaubild des Campaign-Visuals (leicht abgerundete Ecken) beginnen.

## Änderungen in `src/routes/_authenticated/index.tsx`

1. Query erweitern
   - `CampaignRow` um `campaign_visual_url: string | null` ergänzen.
   - `select(...)` um `campaign_visual_url` erweitern.

2. Neue Spalte „Visual“ ganz links
   - Zusätzlicher `<TableHead>` (schmale Breite, z. B. `w-16`), Label leer oder via `t("home.tableVisual")` (neuer Key in `de.json`, deutscher Wert: „Visual“).
   - Pro Zeile ein `<TableCell>` mit 48×48 px Container:
     - Bei vorhandener URL: `<img src={row.campaign_visual_url} alt="" className="h-12 w-12 rounded-md object-cover" />`
     - Fallback: `div` mit `bg-muted`, gleicher Größe/Rundung, kleinem `Megaphone`-Icon in `text-muted-foreground`.

Keine weiteren Layout- oder Logikänderungen. Kein Backend-, Schema- oder Storage-Eingriff.

## Optional / i18n
- `src/locales/de.json` → `home.tableVisual: ""` (leerer Header-Titel wirkt aufgeräumt, Spalte bleibt schmal). Falls Kopfzeile leer bleiben soll, kann der Head-Text ganz entfallen und der `TableHead` leer gerendert werden.
