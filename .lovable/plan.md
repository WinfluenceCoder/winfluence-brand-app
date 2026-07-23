## Ziel

In der `CampaignsTable` am Zeilenende ein 3-Punkte-Menü mit Aktionen ergänzen und eine neue Platzhalterroute `/campaigns/publish/$id` anlegen.

## Änderungen

### 1. `src/components/app/CampaignsTable.tsx`

- Neue Spalte ganz rechts (`TableHead` leer, `w-12`) für das Aktionsmenü.
- Pro Zeile ein shadcn `DropdownMenu` mit `MoreHorizontal`-Trigger (Ghost-IconButton).
  - Trigger-Klick per `stopPropagation`, damit der bestehende Row-Click (Navigation nach Edit) nicht feuert.
- Menüeinträge (jeweils mit Lucide-Icon links):
  - `Pencil` „Bearbeiten" → `router.navigate({ to: "/campaigns/$id/edit", params: { id } })`
  - `Send` „Publizieren" → `router.navigate({ to: "/campaigns/publish/$id", params: { id } })`
  - Separator
  - `Trash2` „Löschen" (rot, `text-destructive focus:text-destructive`) → öffnet lokalen `AlertDialog`.
- Delete-Flow analog zum Button in `CampaignForm`:
  - Vor Öffnen des Dialogs `getCampaignDeletability` per `useMutation`/`useServerFn` prüfen; bei `canDelete=false` Toast mit passendem Grund (`status` / `collabs`) und Dialog nicht öffnen. Alternativ Dialog direkt öffnen und Bedingungen dort anzeigen — Umsetzung analog zu `CampaignForm.tsx` (dortiges Muster übernehmen).
  - Bei Bestätigung `deleteCampaign` aufrufen, danach `queryClient.invalidateQueries({ queryKey: ["campaigns"] })` und Toast.
- i18n-Keys wiederverwenden, wo vorhanden (`campaignsList.actions.*` neu ergänzen, sonst bestehende Delete-Texte aus `campaignForm`/`campaignsList` nutzen).

### 2. `src/locales/de.json`

Neue Keys unter `campaignsList.actions`:

- `openMenu` (aria-label)
- `edit` „Editieren"
- `publish` „Publizieren"
- `delete` „Löschen"

Bestehende Delete-Confirm-/Fehlertexte werden wiederverwendet.

### 3. Neue Route `src/routes/_authenticated/campaigns.publish.$id.tsx`

Platzhalterseite:

```tsx
export const Route = createFileRoute("/_authenticated/campaigns/publish/$id")({
  component: PublishCampaignPage,
});
```

Inhalt: `p-8`, Zurück-Link (`router.history.back()`), `h1` „Kampagne publizieren", Kurztext „Inhalt folgt." Keine Backend-Logik.

### 4. Keine Änderung an

- `src/routes/_authenticated/campaigns.index.tsx` (Tabelle bleibt eingebunden)
- `src/routes/_authenticated/index.tsx` (Dashboard nutzt gleiche Tabelle → Menü erscheint dort automatisch)
- `src/lib/campaigns.functions.ts` (bestehende Server-Funktionen decken Deletability + Delete bereits ab)
- Sidebar / DB / RLS

## Technische Hinweise

- Row-Navigation bleibt (Click auf Zelle → Edit). Menü-Trigger und `DropdownMenuContent` verhindern Propagation.
- Delete-Prüfung server-seitig via bestehende `getCampaignDeletability` / `deleteCampaign` (RLS-Policy in `.lovable/external-supabase-campaigns-delete-policy.sql` bereits vorhanden).