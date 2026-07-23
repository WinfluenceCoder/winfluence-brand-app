## Ziel
Sidebar-Submenü „Kampagnen" anpassen: „Entwürfe" auf Route `/campaigns/draft` umbenennen, „Abgeschlossene" auf `/campaigns/ended`, neuer Eintrag „Genehmigte" (`/campaigns/approved`), „Archiv" auf `/campaigns/archived`. Nur Sidebar, Routen und Platzhalter-Seiten — keine Backend-Logik.

## Änderungen

### 1. Routen umbenennen / neu anlegen (`src/routes/_authenticated/`)
- `campaigns.drafts.tsx` → `campaigns.draft.tsx`, `createFileRoute("/_authenticated/campaigns/draft")`.
- `campaigns.completed.tsx` → `campaigns.ended.tsx`, `createFileRoute("/_authenticated/campaigns/ended")`.
- `campaigns.archive.tsx` → `campaigns.archived.tsx`, `createFileRoute("/_authenticated/campaigns/archived")`.
- Neu: `campaigns.approved.tsx` mit `Placeholder titleKey="placeholders.campaignsApproved"`.

### 2. `src/components/app/AppSidebar.tsx`
Kampagnen-Items neu ordnen:
1. Neu (`/campaigns/new`)
2. Entwürfe (`/campaigns/draft`) — Key `nav.campaignsDraft`
3. Publizierte (`/campaigns/published`)
4. Laufende (`/campaigns/running`)
5. Abgelaufene (`/campaigns/expired`)
6. Abgeschlossene (`/campaigns/ended`) — Key `nav.campaignsEnded`
7. Genehmigte (`/campaigns/approved`) — Key `nav.campaignsApproved` *(neu)*
8. Archiv (`/campaigns/archived`) — Key `nav.campaignsArchived`

### 3. `src/locales/de.json`
- `nav.campaignsDrafts` → `nav.campaignsDraft` („Entwürfe")
- `nav.campaignsCompleted` → `nav.campaignsEnded` („Abgeschlossene")
- `nav.campaignsArchive` → `nav.campaignsArchived` („Archiv")
- Neu: `nav.campaignsApproved` = „Genehmigte"
- Analog in `placeholders`: `campaignsDrafts` → `campaignsDraft`, `campaignsCompleted` → `campaignsEnded`, `campaignsArchive` → `campaignsArchived`, neu `campaignsApproved` = „Genehmigte Kampagnen".

### 4. `routeTree.gen.ts`
Nicht editieren — wird beim nächsten Build automatisch regeneriert.

## Komplettes Sidebar-Menü nach der Überarbeitung

```text
Home                          /
Kampagnen
  ├─ Neu                      /campaigns/new
  ├─ Entwürfe                 /campaigns/draft        (umbenannt)
  ├─ Publizierte              /campaigns/published
  ├─ Laufende                 /campaigns/running
  ├─ Abgelaufene              /campaigns/expired
  ├─ Abgeschlossene           /campaigns/ended        (umbenannt)
  ├─ Genehmigte               /campaigns/approved     (neu)
  └─ Archiv                   /campaigns/archived     (umbenannt)
Influencer
  ├─ Suche                    /influencers/search
  ├─ Aktuelle                 /influencers/current
  ├─ Beauftragte              /influencers/hired
  └─ Favoriten                /influencers/favorites
Analytics
  ├─ Kampagnen                /analytics/campaigns
  └─ Influencer               /analytics/influencers
Nachrichten
  ├─ Benachrichtigungen       /messages/notifications
  ├─ Persönlich               /messages/personal
  └─ System                   /messages/system
Einstellungen                 /settings
```

## Nicht enthalten
- Keine Backend-/DB-Änderungen, keine neuen Listen-Queries.
- Alte Routen `/campaigns/drafts`, `/campaigns/completed`, `/campaigns/archive` werden entfernt (keine Redirects).
