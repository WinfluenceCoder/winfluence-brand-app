## Ziel
Sofortige Validierung der drei Datumsfelder auf `/campaigns/publish/$id` sowie Sperren des Publizieren-Buttons bei Fehlern.

## Änderungen in `src/routes/_authenticated/campaigns.publish.$id.tsx`

1. **useForm-Konfiguration erweitern**
   - `mode: "onChange"` setzen, damit Fehler sofort bei Änderung des Datums erscheinen.
   - `reValidateMode: "onChange"` für laufende Re-Validierung.

2. **Initial-Validierung beim Laden**
   - Nach `useForm` in einem `useEffect` (ohne Deps) einmalig `form.trigger()` aufrufen, damit die Fehlermeldungen für die per `defaultValues` bereits gesetzten Werte (aus `campaign.apply_till` / `start` / `ende`) sofort unter den Feldern angezeigt werden — insbesondere wenn ein alter `apply_till`-Wert die "mindestens 1 Tag"-Regel verletzt.

3. **Publizieren-Button sperren**
   - Aus `form.formState` zusätzlich `isValid` lesen.
   - Button-`disabled`-Condition erweitern:
     `!isDraft || submitting || !agbAccepted || !form.formState.isValid`.

## Nicht betroffen
- Keine Änderung an `publishCampaign`, Zod-Schema oder Übersetzungen — Fehlermeldungen und Regeln existieren bereits und werden bereits rot unter den Feldern gerendert.
- Kein Backend-Change.