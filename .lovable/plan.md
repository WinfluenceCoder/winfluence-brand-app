## Antwort auf deine Frage
Ja — eine einzige Seite `/campaigns` mit Status-Filter macht Sinn:
- Nur **eine** Route + **eine** Query, keine 7 fast-identischen Dateien.
- Filter/Sortierung/Pagination sind später an genau einer Stelle erweiterbar.
- Status als URL-Search-Param (`?status=draft`) → deep-linkable, browser-back funktioniert.
- Sidebar-Einträge linken direkt auf `/campaigns?status=draft` etc.

Tabelle wird als wiederverwendbare Komponente extrahiert; Dashboard und `/campaigns` nutzen dieselbe.

## Architektur

### 1. Shared Query-Layer — `src/lib/campaigns-list.ts`
- Typ `CampaignListRow` (identisch zur heutigen `CampaignRow` im Dashboard).
- Konstante `CAMPAIGN_STATUSES = ["draft","published","running","expired","ended","approved","archived"] as const`.
- `campaignsListQueryOptions({ status, statusIn })` liefert `queryOptions`:
  - `queryKey`: `["campaigns","list", status ?? "all"]` bzw. `["campaigns","list","in", statusIn.join(",")]`.
  - `queryFn`: lädt Brand-ID, dann `campaigns`-Rows; `status` → `.eq('status', status)`, `statusIn` → `.in('status', statusIn)`, keiner → alle.

### 2. Wiederverwendbare Tabelle — `src/components/app/CampaignsTable.tsx`
- Props: `rows: CampaignListRow[]`.
- Spalten: Thumbnail, Titel, Status-Badge, Start, Ende, Budget (rechtsbündig). Row-Click → `/campaigns/$id/edit`.
- Helper `statusLabel` / `statusVariant` / `formatDate` wandern hierher (heute inline in `index.tsx`).

### 3. Neue Sammelroute — `src/routes/_authenticated/campaigns.index.tsx`
Pfad `/_authenticated/campaigns/` → URL `/campaigns`.

**Layout — visuelle Vorlage: Dashboard-Kachel „Meine Kampagnen"**
Seite besteht aus **einer** `Card` (identisches Padding, Header-Layout und Table-Look wie heute im Dashboard):
- `CardHeader` (`flex flex-row items-center justify-between`):
  - Links: `CardTitle` „Kampagnen" **plus** direkt daneben der Status-Filter (shadcn `Select`, `size` klein, ~180 px breit) mit Optionen „Alle Stati" + je einem Label pro Status. Ausgewählter Wert kommt aus `Route.useSearch().status`.
  - Rechts: Button „Neue Kampagne" → `/campaigns/new` (identisch zum Dashboard-Button, mit `Plus`-Icon).
- `CardContent`: `<CampaignsTable rows={data} />`.
- Empty-State (kein Row bei aktivem Filter): innerhalb `CardContent` kurzer Hinweistext „Keine Kampagnen mit diesem Status." + Link „Alle anzeigen" (setzt `status=all`). Der Dashboard-typische Megaphone-CTA bleibt **exklusiv im Dashboard**.

**Route-Config**
- `validateSearch` (Zod + `fallback` aus `@tanstack/zod-adapter`):
  - `status: fallback(z.string(), "all").default("all")` — ungültige Werte werden im Component auf `"all"` geklemmt.
- `loaderDeps: ({ search }) => ({ status: search.status })`.
- `loader`: `context.queryClient.ensureQueryData(campaignsListQueryOptions({ status: status === "all" ? undefined : status }))`.
- Filter-Change → `navigate({ search: (p) => ({ ...p, status: next }) })`.

### 4. Alte Status-Routen entfernen
Diese 7 Dateien werden **gelöscht** (keine Redirects nötig):
- `campaigns.draft.tsx`, `campaigns.published.tsx`, `campaigns.running.tsx`, `campaigns.expired.tsx`, `campaigns.ended.tsx`, `campaigns.approved.tsx`, `campaigns.archived.tsx`.

`src/routeTree.gen.ts` wird beim nächsten Build automatisch regeneriert.

### 5. Sidebar — `src/components/app/AppSidebar.tsx`
Sub-Menü-Einträge behalten Label/Reihenfolge, linken aber auf die Sammelroute mit Search-Param:
```tsx
{ titleKey: "nav.campaignsDraft",     to: "/campaigns", search: { status: "draft" } },
{ titleKey: "nav.campaignsPublished", to: "/campaigns", search: { status: "published" } },
// … analog running / expired / ended / approved / archived
```
`isActive`-Logik erweitert: aktiv, wenn `pathname === "/campaigns"` **und** aktueller Search-`status` mit dem Item übereinstimmt.

### 6. Dashboard — `src/routes/_authenticated/index.tsx`
- Query auf `campaignsListQueryOptions({ statusIn: ["draft","published","running","expired","ended"] })` (aktive Stati wie heute — ohne `approved`/`archived`).
- Rendert `<CampaignsTable rows={data} />` statt inline-Tabelle; Empty-State (Megaphone-CTA) bleibt wie bisher.

### 7. i18n — `src/locales/de.json`
Neuer Abschnitt `campaignsList`:
- `title`: „Kampagnen"
- `filterAll`: „Alle Stati"
- `status.draft` … `status.archived` (Labels für alle 7 Stati; neu für `approved` und `archived`).
- `emptyForFilter`: „Keine Kampagnen mit diesem Status."
- `showAll`: „Alle anzeigen".

Bestehende `home.newCampaign` / `home.tableName` etc. werden weiterverwendet.

## Betroffene / neue Dateien
- **Neu**: `src/lib/campaigns-list.ts`, `src/components/app/CampaignsTable.tsx`, `src/routes/_authenticated/campaigns.index.tsx`.
- **Geändert**: `AppSidebar.tsx`, `_authenticated/index.tsx` (Dashboard), `src/locales/de.json`.
- **Gelöscht**: 7 × `campaigns.<status>.tsx`.
- **Nicht angefasst**: `campaigns.new.tsx`, `campaigns.$id.edit.tsx`, `campaigns.functions.ts`, DB / RLS.

## Nicht enthalten
- Kein Sortier-/Such-/Pagination-UI (kann später an genau einer Stelle ergänzt werden).
- Keine Backend-/Berechtigungsänderungen.
