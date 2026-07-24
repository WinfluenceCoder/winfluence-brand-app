# Kampagnen-Workflow

> **Single source of truth** für den status-abhängigen Kampagnen-Workflow (Tabellen-Zeilen-Klick, „Next Step"-Spalte und Kontextmenü in `src/components/app/CampaignsTable.tsx`).
>
> **Regel:** Bei jeder Änderung an Row-Click, Next Step oder Kontextmenü MUSS diese Datei zusammen mit `src/lib/campaign-workflow.ts` aktualisiert werden.

## Übersicht

| Status      | Zeilen-Klick                  | Next Step                                     | Kontextmenü                                                                                     |
| ----------- | ----------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `draft`     | `/campaigns/$id/edit`         | Publizieren → `/campaigns/publish/$id`        | Bearbeiten · Vorschau (neuer Tab) · Publizieren · Löschen                                       |
| `published` | `/campaigns/curate/$id`       | Starten → `/campaigns/start/$id`              | Bearbeiten · Kuratieren · Zurückziehen · Starten                                                |
| `running`   | `/campaigns/monitor/$id`      | Beenden → `/campaigns/end/$id`                | Überwachen · Bewerten · Beenden                                                                 |
| `expired`   | `/campaigns/monitor/$id`      | Verlängern → `/campaigns/extend/$id`          | Überwachen · Bewerten · Beenden                                                                 |
| `ended`     | `/campaigns/rate/$id`         | Genehmigen → `/campaigns/approve/$id`         | Überwachen · Bewerten · Genehmigen                                                              |
| `approved`  | `/campaigns/stats/$id`        | Archivieren → `/campaigns/archive/$id`        | Statistik · Archivieren                                                                          |
| `archived`  | `/campaigns/stats/$id`        | Neu starten → `/campaigns/re-start/$id`       | Statistik · Neu starten                                                                          |

## Aktionen und Icons

Alle Icons stammen aus `lucide-react`.

| Aktion       | i18n-Key                              | Icon           | Ziel-Route                    |
| ------------ | ------------------------------------- | -------------- | ----------------------------- |
| Bearbeiten   | `campaignsList.actions.edit`          | `Pencil`       | `/campaigns/$id/edit`         |
| Vorschau     | `campaignsList.actions.preview`       | `Eye`          | `/campaigns/preview/$id` (neuer Tab) |
| Publizieren  | `campaignsList.actions.publish`       | `Send`         | `/campaigns/publish/$id`      |
| Löschen      | `campaignsList.actions.delete`        | `Trash2`       | (Delete-Flow, keine Navigation) |
| Starten      | `campaignsList.actions.start`         | `Play`         | `/campaigns/start/$id`        |
| Beenden      | `campaignsList.actions.end`           | `Square`       | `/campaigns/end/$id`          |
| Verlängern   | `campaignsList.actions.extend`        | `CalendarPlus` | `/campaigns/extend/$id`       |
| Genehmigen   | `campaignsList.actions.approve`       | `CheckCircle2` | `/campaigns/approve/$id`      |
| Archivieren  | `campaignsList.actions.archive`       | `Archive`      | `/campaigns/archive/$id`      |
| Neu starten  | `campaignsList.actions.restart`       | `RotateCcw`    | `/campaigns/re-start/$id`     |
| Kuratieren   | `campaignsList.actions.curate`        | `ListChecks`   | `/campaigns/curate/$id`       |
| Zurückziehen | `campaignsList.actions.revoke`        | `Undo2`        | `/campaigns/revoke/$id`       |
| Überwachen   | `campaignsList.actions.monitor`       | `Activity`     | `/campaigns/monitor/$id`      |
| Bewerten     | `campaignsList.actions.rate`          | `Star`         | `/campaigns/rate/$id`         |
| Statistik    | `campaignsList.actions.stats`         | `BarChart3`    | `/campaigns/stats/$id`        |

## Hinweise

- Löschen ist nur bei `draft` verfügbar und nur, wenn keine verknüpften Collabs existieren (siehe `getCampaignDeletability`).
- Die Vorschau wird immer in einem neuen Browserfenster geöffnet.
- Konfiguration: `src/lib/campaign-workflow.ts` — dort werden Icons, Übersetzungen und Routen zentral gepflegt.
