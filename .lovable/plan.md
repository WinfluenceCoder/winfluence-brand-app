# Kampagnenliste: Spalte «Frist bis»

Neue Spalte in der Kampagnen-Tabelle (Dashboard und `/campaigns`), gefüllt mit `campaigns.apply_till`. Ist die Frist in der Vergangenheit, wird das Datum in dieser Zelle rot dargestellt.

## Umsetzung

1. `src/lib/campaigns-list.ts`
   - `apply_till: string | null` im Typ `CampaignListRow` ergänzen.
   - Feld `apply_till` in die `select`-Liste der bestehenden Abfrage aufnehmen (keine Schemaänderung, nur Lesezugriff).

2. `src/components/app/CampaignsTable.tsx`
   - Neue Spaltenüberschrift `Frist bis` direkt vor `Start`.
   - Neue Zelle vor der Start-Zelle: `formatDate(row.apply_till)`.
   - Rote Darstellung nur in dieser Zelle, wenn `apply_till` gesetzt und < jetzt (Design-Token `text-destructive`, kein hartkodiertes Rot).

3. `src/locales/de.json`
   - Neuer Key `home.tableApplyTill` = "Frist bis".

Keine Backend-Änderungen, keine neuen Routen.
