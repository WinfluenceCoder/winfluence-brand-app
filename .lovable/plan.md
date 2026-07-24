# Kampagnen-Workflow: Status-abhängige Aktionen

## Neue Platzhalter-Routen

Je eine Datei unter `src/routes/_authenticated/` mit Zurück-Link, Titel und ID-Anzeige (analog `campaigns.preview.$id.tsx`):

- `campaigns.start.$id.tsx` → `/campaigns/start/$id`
- `campaigns.end.$id.tsx` → `/campaigns/end/$id`
- `campaigns.extend.$id.tsx` → `/campaigns/extend/$id`
- `campaigns.approve.$id.tsx` → `/campaigns/approve/$id`
- `campaigns.archive.$id.tsx` → `/campaigns/archive/$id`
- `campaigns.re-start.$id.tsx` → `/campaigns/re-start/$id`
- `campaigns.curate.$id.tsx` → `/campaigns/curate/$id`
- `campaigns.revoke.$id.tsx` → `/campaigns/revoke/$id`
- `campaigns.monitor.$id.tsx` → `/campaigns/monitor/$id`
- `campaigns.rate.$id.tsx` → `/campaigns/rate/$id`
- `campaigns.stats.$id.tsx` → `/campaigns/stats/$id`

(Hinweis: User schreibt teils `/campaign/...`, teils `/campaigns/...`. Ich vereinheitliche auf `/campaigns/...`, konsistent mit den bestehenden Routen `campaigns/publish`, `campaigns/preview`, `campaigns/$id/edit`.)

## Zentrale Workflow-Map

Neue Datei `src/lib/campaign-workflow.ts` mit einer Map `status → { rowClick, nextStep, menu[] }`. Jede Aktion trägt: `key`, Übersetzungs-Key, Lucide-Icon, Ziel-Route (`to` + optional `openInNewTab`). Diese Map ist Single Source of Truth für Tabelle und Menü.

Icon-Zuordnung (Lucide):
- publizieren `Send`, starten `Play`, beenden `Square`, verlängern `CalendarPlus`, genehmigen `CheckCircle2`, archivieren `Archive`, neu starten `RotateCcw`
- bearbeiten `Pencil`, Vorschau `Eye`, löschen `Trash2`
- kuratieren `ListChecks`, zurückziehen `Undo2`
- überwachen `Activity`, bewerten `Star`, Statistik `BarChart3`

## `src/components/app/CampaignsTable.tsx`

- Neue Spalte „Next Step" rechts neben Status. Rendert Icon + Link-Text aus Workflow-Map (Standard: interner `<Link>`; `stopPropagation` gegen Row-Click). `draft` → nutzt bestehende Preview-Regel (in neuem Tab, sonst intern).
- Kontext-Menü: statt fester Einträge aus Workflow-Map generiert. Löschen für `draft` bleibt am Ende separat (bestehender Delete-Flow mit `AlertDialog`). Vorschau öffnet in neuem Tab (`target="_blank"`).
- Row-Click: statt fixer Route auf `campaigns/$id/edit` → Ziel aus Workflow-Map (`rowClick`). Menü-Zelle behält `stopPropagation`.

## Übersetzungen

`src/locales/de.json` → `campaignsList.actions` um neue Keys erweitern: `start`, `end`, `extend`, `approve`, `archive`, `restart`, `curate`, `revoke`, `monitor`, `rate`, `stats`, `nextStep` (Spaltentitel).

## Workflow-Dokumentation

Neue Datei `docs/campaign-workflow.md` mit Tabelle (Spalten: Status | Zeilen-Klick | Next Step | Kontext-Menü). Am Anfang der Datei ein Hinweis: „Diese Datei ist Single Source of Truth für den Kampagnen-Workflow. Bei Änderungen an Tabelle/Menü/Row-Click IMMER auch diese Datei aktualisieren."

Zusätzlich Regel in `AGENTS.md` ergänzen: Verweis auf `docs/campaign-workflow.md` mit der Pflicht, das MD-File synchron zu halten.

## Nicht betroffen

- Keine DB-/RLS-Änderung, keine neuen Server-Funktionen (Status-Übergänge kommen laut Aufgabenstellung in Folge-Prompts).
- `campaigns.publish.$id.tsx` und `campaigns.preview.$id.tsx` bleiben unverändert.
