## Änderungen auf `/campaigns`

### 1. Kachel entfernen
In `src/routes/_authenticated/campaigns.index.tsx` die `Card`/`CardHeader`/`CardContent`-Struktur entfernen. Stattdessen:
- Seitentitel `h1` „Meine Kampagnen" (analog Dashboard-Stil: `text-2xl font-semibold tracking-tight`)
- Rechts daneben Button „Neue Kampagne"
- Darunter direkt die `CampaignsTable` (ohne Card-Wrapper)

Dashboard (`/`) bleibt unverändert — dort wird die Tabelle weiterhin in einer Card angezeigt.

### 2. Status-Filter in Tabellen-Header verschieben
- Das `Select`-Dropdown aus dem Card-Header entfernen.
- In `src/components/app/CampaignsTable.tsx` die Spalte `Status` (`TableHead`) so umbauen, dass sie optional ein Dropdown enthält, wenn eine `statusFilter`-Prop übergeben wird:
  - Prop-Signatur erweitern: `statusFilter?: { value: string; onChange: (v: string) => void }`
  - Wenn gesetzt: `TableHead` rendert das `Select` inline statt reinem Text
  - Wenn nicht gesetzt (Dashboard): normaler Text-Header „Status"
- Styling des `SelectTrigger`:
  - Ohne Border/Background, damit es visuell wie ein Header-Label wirkt
  - Schriftgröße/Farbe/Gewicht analog `TableHead` (`text-sm font-medium text-muted-foreground` — shadcn-Default)
  - Breite `w-auto` mit passendem Padding, Chevron-Icon bleibt sichtbar
- Optionen: „Alle Stati" + alle sieben Status-Labels (aus i18n).

### 3. Empty-State
Der bisherige „keine Kampagnen für Filter"-Bereich bleibt erhalten, wird aber unterhalb der Tabelle (bzw. anstelle der Tabelle bei leerem Ergebnis) gerendert — ohne Card-Wrapper, mit gleicher Padding-Struktur wie bisher.

### Betroffene Dateien
- `src/routes/_authenticated/campaigns.index.tsx` — Card entfernen, Titel + Button-Layout, `statusFilter`-Prop an Tabelle übergeben
- `src/components/app/CampaignsTable.tsx` — optionale `statusFilter`-Prop, Status-Header rendert Dropdown
- `src/locales/de.json` — ggf. Titel-Key ergänzen (`campaignsList.title` existiert bereits, wird auf „Meine Kampagnen" gesetzt falls abweichend)

Dashboard bleibt unangetastet.
