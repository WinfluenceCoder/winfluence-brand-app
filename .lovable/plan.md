Die Tabelle bleibt bestehen, wird aber visuell in einer Kachel dargestellt – analog zur leeren Kachel für „erste Kampagne“.

### Änderungen
1. `src/locales/de.json`
   - `home.title` auf „Meine Kampagnen“ ändern.

2. `src/routes/_authenticated/index.tsx`
   - Überschrift bleibt via `home.title` und zeigt „Meine Kampagnen“.
   - Leerzustand bleibt unverändert (bereits als Kachel im dashed-Stil).
   - Im Daten vorhanden-Zustand die Tabelle in eine Kachel/Card einbetten:
     - `rounded-xl border bg-card p-6 shadow` als äusserer Rahmen.
     - Tabelle inklusive Header/Zeilen/Status-Badge/Budget bleibt wie aktuell.
   - Button „Neue Kampagne“ bleibt oben rechts.

### Nicht enthalten / Keine Backend-Änderungen
- Die Supabase-Query und die Datenstruktur bleiben unverändert.
- Keine neue Route oder Detailansicht.
- Keine Änderungen an der externen Datenbank.