# Kontextmenü erweitern: „Live Ansicht" / „Ansicht"

## Ziel

In der Kampagnen-Tabelle erhält das Kontextmenü (3 Punkte) einen zusätzlichen Eintrag an **Position 2**:

| Status      | Neuer Eintrag  |
| ----------- | -------------- |
| `published` | Live Ansicht   |
| `running`   | Live Ansicht   |
| `expired`   | Live Ansicht   |
| `ended`     | Live Ansicht   |
| `approved`  | Ansicht        |
| `archived`  | Ansicht        |

Alle öffnen `/campaigns/preview/$id` in einem neuen Browser-Tab, Icon `Eye`.

## Umsetzung

`src/lib/campaign-workflow.ts`
- Zwei neue Aktionen ergänzen, die dieselbe Route und dasselbe Icon wie `preview` nutzen, sich aber im Label unterscheiden:
  - `liveView` → Label „Live Ansicht", Icon `Eye`, Route `/campaigns/preview/$id`, `openInNewTab: true`
  - `view` → Label „Ansicht", Icon `Eye`, Route `/campaigns/preview/$id`, `openInNewTab: true`
- Menüs anpassen (jeweils Position 2):
  - `published`: Bearbeiten · **Live Ansicht** · Kuratieren · Zurückziehen · Starten
  - `running`: Überwachen · **Live Ansicht** · Bewerten · Beenden
  - `expired`: Überwachen · **Live Ansicht** · Bewerten · Beenden
  - `ended`: Überwachen · **Live Ansicht** · Bewerten · Genehmigen
  - `approved`: Statistik · **Ansicht** · Archivieren
  - `archived`: Statistik · **Ansicht** · Neu starten
- `draft` bleibt unverändert (dort weiterhin „Vorschau").

`src/locales/de.json`
- Neue i18n-Keys `campaignsList.actions.liveView` = „Live Ansicht" und `campaignsList.actions.view` = „Ansicht".

Hinweis: Der bestehende Key `campaignsList.actions.preview` lautet „Vorschau" und wird von `draft` genutzt. Da die neuen Einträge zwei unterschiedliche Beschriftungen brauchen, kommen dafür eigene Keys hinzu statt den bestehenden umzubenennen.

`src/components/app/CampaignsTable.tsx`
- Keine Änderung nötig: das Rendern von `openInNewTab`-Aktionen ist bereits implementiert.

`docs/campaign-workflow.md`
- Übersichtstabelle: Kontextmenü-Spalte für die sechs Status um den neuen Eintrag an Position 2 ergänzen.
- Aktions-Tabelle: Zeilen für „Live Ansicht" und „Ansicht" mit Key, Icon `Eye` und Ziel-Route (neuer Tab) ergänzen.
