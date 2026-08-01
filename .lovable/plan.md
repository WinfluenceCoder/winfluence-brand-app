# Start-Button-Label in /campaigns/curate/$id auf Deutsch korrigieren

## Ziel
Der „Starten“-Button am Ende der Kuratierungsseite soll korrekt auf Deutsch als „Starten“ angezeigt werden.

## Ursache
In `src/routes/_authenticated/campaigns.curate.$id.tsx` wird der Button mit `t("campaigns.actions.start")` übersetzt. Dieser Schlüssel existiert in `src/locales/de.json` nicht. Die deutsche Übersetzung steht unter `campaignsList.actions.start`.

## Änderung
- In `src/routes/_authenticated/campaigns.curate.$id.tsx` den Übersetzungsschlüssel für den Start-Button von `campaigns.actions.start` auf `campaignsList.actions.start` ändern.
- Keine Schema-, Backend- oder sonstigen UI-Änderungen.

## Validierung
- Kuratierungsseite öffnen; Button zeigt sauber „Starten“ an.
