# Kampagnen-Titel auf /campaigns/curate/$id anzeigen

## Ursache

Die Kuratierungs-Seite liest den Titel aus dem falschen Feld. Sie übergibt an die Campaign Card `campaign.name`, die Tabelle `campaigns` hat aber die Spalte `title` (so wie sie auch im Kampagnen-Formular und in der Publish-Seite genutzt wird). `name` ist deshalb immer leer, und die Card zeigt den Platzhalter „–“.

## Änderung

- `src/routes/_authenticated/campaigns.curate.$id.tsx`: beim Aufbau der Card-Daten `title: campaign.title ?? null` statt `campaign.name` verwenden.

Keine Schema-Änderungen, keine Änderung an Datenlayer oder Card-Komponente.
