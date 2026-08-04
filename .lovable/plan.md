# /invite/$id als Overlay-Seite ohne App-Chrome

## Ziel
Die Seite `/invite/$id` soll nicht mehr innerhalb des normalen App-Layouts (Sidebar, Header, Footer) erscheinen, sondern als modales Overlay über der vorherigen Seite. Der Inhalt (Titel, Filter, Tabelle, Paging, CTA) bleibt erhalten; CampaignCard und der Zurück-Button entfallen. Oben rechts erscheint ein Close-Icon, das zurück navigiert.

## Warum ein neues Layout nötig
Das aktuelle Layout für authentifizierte Routen (`src/routes/_authenticated/route.tsx`) rendert immer `<AppSidebar />`, `<AppHeader />` und `<AppFooter />`. Um die Einladungsseite ohne diese Elemente zu zeigen, aber trotzdem hinter dem Auth-Gate zu behalten, wird ein neues pathless Layout `_overlay` eingeführt.

## Geplante Änderungen

### 1. Neues Auth-Layout `_overlay` anlegen
Neue Datei `src/routes/_overlay.tsx`:
- Prüft wie `_authenticated` via `supabase.auth.getUser()`, ob ein Benutzer angemeldet ist; sonst Redirect auf `/login`.
- Rendert nur `<Outlet />`, keinen Header, keine Sidebar, keinen Footer.
- Keine zusätzlichen Datenladungen oder UI-Elemente.

### 2. Route verschieben und Route-ID anpassen
- Datei `src/routes/_authenticated/invite.$id.tsx` verschieben nach `src/routes/_overlay/invite.$id.tsx`.
- In `createFileRoute` den Pfad von `/_authenticated/invite/$id` auf `/_overlay/invite/$id` ändern.
- Die öffentliche URL bleibt weiterhin `/invite/$id` (weil `_overlay` pathless ist), daher ändert sich der Link in `CurationBoard.tsx` nicht.

### 3. Seiten-UI auf Overlay-Modus umstellen (`src/routes/_overlay/invite.$id.tsx`)
- Entfernen:
  - `CampaignCard` und der zugehörige `getMyCampaign`-Load.
  - Zurück-Button mit `ChevronLeft` und `router.history.back()`.
- Hinzufügen:
  - Oben rechts ein Close-Button (Lucide `X`) mit `router.history.back()`.
  - Ein Container, der die Seite als Overlay darstellt: z. B. `fixed inset-0 z-50 bg-background overflow-auto` oder ein zentrierter, abgerundeter Dialog-ähnlicher Bereich. Der Nutzer wünscht "Overlay" – hier wird ein fullscreen Overlay mit Innenabstand gewählt, damit der Inhalt weiterhin lesbar bleibt.
- Titel, Filter, Tabelle, Paging und CTA bleiben unverändert erhalten.
- Imports von `ChevronLeft`, `CampaignCard`, `getMyCampaign` und `useServerFn` entfallen; `X` von `lucide-react` kommt hinzu.

### 4. i18n (nur falls nötig)
Prüfen, ob der bereits vorhandene `invite.title`-Key weiterhin passt. Keine neuen Keys nötig, da das Close-Icon rein visuell ist (ggf. `aria-label="{common.close}"`).

### 5. Keine Backend-Änderungen
- Keine Schema-Änderungen, keine Migrationen, keine Lovable Cloud, keine neuen Policies.
- Datenlayer `src/lib/campaign-invite.ts` bleibt unverändert.

## Verifikation
- Build/Typcheck muss passieren.
- Route-Tree (`src/routeTree.gen.ts`) wird automatisch neu generiert.
- Navigation aus `/campaigns/curate/$id` über den "Influencer einladen"-Button muss weiterhin auf `/invite/$id` führen.
- Im Preview: Overlay öffnet, Header/Sidebar/Footer sind nicht sichtbar, Close-Button funktioniert.
