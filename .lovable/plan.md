## Fix Branche-Feld auf /profile

**Problem 1 – Übersetzungen:** Der Block `industry` in `src/locales/de.json` ist versehentlich innerhalb von `campaignForm` verschachtelt (nach dem `errors`-Objekt, vor dessen Schluss-Klammer). Deshalb sind die Keys aktuell nur unter `campaignForm.industry.*` verfügbar, das Dropdown liest sie aber via `t('industry.<slug>')` → es zeigt die Rohschlüssel.

**Problem 2 – Vollständigkeit:** `industry` fehlt im `brandFields`-Array in `src/routes/_authenticated/profile.tsx`. Bei `industry = null` wird der Abschnitt „Mein Brand“ trotzdem als vollständig markiert und zählt zu 100 % in die Gesamt-Vollständigkeit.

### Änderungen

1. `src/locales/de.json`
   - `industry`-Block aus `campaignForm` herauslösen und als Top-Level-Key auf gleicher Ebene wie `campaignForm`, `profile` usw. platzieren.
   - Die schließende Klammer von `campaignForm.errors` korrekt setzen, sodass `campaignForm` sauber geschlossen wird.

2. `src/routes/_authenticated/profile.tsx`
   - `watched.industry` in `brandFields` aufnehmen, damit ein leeres Branche-Feld
     - den grünen Check bei „Mein Brand“ verhindert und
     - in die Gesamtvollständigkeit (%) einfließt.

Keine Schema-Änderungen, keine Server-Logik-Änderungen.