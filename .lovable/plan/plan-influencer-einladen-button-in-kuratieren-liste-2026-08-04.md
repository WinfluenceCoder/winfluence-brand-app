Plan: "Influencer einladen"-Button in Kuratieren-Liste

1. Ziel
In der rechten Spalte der Route `/campaigns/curate/$id` (Card-Titel "beworben haben sich") einen rechtsbündigen Button "Influencer einladen" hinzufügen, der auf `/invite/$id` verlinkt.

2. Technische Details
- Datei `src/components/app/CurationBoard.tsx`
  - `Column`-Komponente um ein optionales Prop `action?: ReactNode` erweitern.
  - `CardHeader` auf `flex flex-row items-center justify-between space-y-0` umstellen, damit Titel links und Button rechts auf gleicher Höhe stehen.
  - Rechten Spalte (`RIGHT`) ein `action` übergeben: TanStack Router `Link` nach `/invite/$id` mit `params={{ id: String(campaignId) }}`, darin ein `Button` mit `variant="outline"` und `size="sm"`.
- Datei `src/locales/de.json`
  - Neuen Key unter `campaigns.curate` hinzufügen: `inviteInfluencers: "Influencer einladen"`.

3. Keine Änderungen an
- Backend/RLS/SQL
- Datenbankschema
- Weitere Routen oder Komponenten
