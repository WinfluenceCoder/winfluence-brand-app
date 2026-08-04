# Route /invite/:id — Creators einladen

## Ziel
Neue Seite, auf der der Brand aus einer Liste aller aktiven Creators auswählt und sie zu einer Kampagne einlädt (`collabs` mit `status = 'invited'`).

## Seitenaufbau (Layout analog /campaigns/curate/$id)
- Zurück-Link, Titel „Creators einladen" (`invite.title`)
- Bestehende `CampaignCard` mit der Kampagne aus `:id` (Daten über `getMyCampaign`, wie auf der Kuratierungsseite)
- Filterzeile, Tabelle, darunter Paging (25 pro Seite) und der CTA

## Tabelle
Spalten: Checkbox „Einladen" | Avatar (`creators.foto_url`, Fallback Initialen) | Nickname | Followers Instagram „–" | Followers TikTok „–" | Followers YouTube „–" | Bewertung Ø

- Es werden nur Creators mit `creators.status = 'active'` geladen (keine Status-Spalte).
- Bewertung Ø = Mittelwert aller `collabs.brand_rating` des Creators über alle Kampagnen, 1 Dezimalstelle, sonst „–".
- Zeilen mit bestehender Collab zu dieser Kampagne: keine Checkbox, stattdessen Badge mit dem Collab-Status (`applied`, `selected`, `invited`, …).
- Header-Checkbox schaltet alle einladbaren Zeilen der aktuell sichtbaren (gefilterten) Seite an/aus; Auswahl bleibt beim Seitenwechsel erhalten.

## Filter
- Instagram vorhanden / TikTok vorhanden / YouTube vorhanden (jeweils `*_url not null`)
- Mindest-Bewertung
- Collab-Status zu dieser Kampagne, inkl. Option „keine Collab"

Filter wirken vor dem Paging; bei Filterwechsel zurück auf Seite 1.

## CTA
Ein Button „X ausgewählte einladen", disabled ohne Auswahl. Klick → ein Batch-Insert in `collabs` mit `{ campaign_id, creator_id, status: 'invited' }` pro Creator. Erfolg: Toast „X Creators eingeladen" (sonner) und Navigation auf `/campaigns/curate/$id`. Fehler: Fehler-Toast, keine Navigation.

## Technische Umsetzung
- Neue Datei `src/routes/_authenticated/invite.$id.tsx` (URL `/invite/$id`, hinter dem bestehenden Auth-Gate).
- Neues Datenmodul `src/lib/campaign-invite.ts`: 
  - `inviteCreatorsQueryOptions(campaignId)` — zwei Reads über den bestehenden externen Client: (a) aktive Creators (`id, nick_name, foto_url, first_name, last_name, insta_url, tiktok_url, youtube_url`), (b) `collabs` mit `creator_id, campaign_id, status, brand_rating`; im Client zu Zeilen mit Collab-Status dieser Kampagne + Rating-Durchschnitt zusammengeführt.
  - `inviteCreators(campaignId, creatorIds)` — ein `insert()` mit Array.
- Tabelle/Filter mit vorhandenen shadcn-Komponenten (Table, Checkbox, Select, Badge, Avatar) und TanStack Query; Loading = Skeletons, Empty- und Error-State analog Kuratierungsseite.
- Keine Schema-Änderungen, keine Migrationen, keine Edge Functions, kein Lovable Cloud.

## Voraussetzung in der externen Datenbank (nur Rechte/Policies)
Die aktuellen Policies erlauben Brand-Usern nur Creators mit aktivem Collab zu lesen (`creator_has_active_collab`), und für `collabs` existiert kein INSERT-Recht. Ich lege dafür ein SQL-Snippet unter `.lovable/external-supabase-invite-policies.sql` ab, das du im SQL-Editor deines Projekts ausführst:
- `SELECT`-Policy: Brand-Users dürfen Creators mit `status = 'active'` lesen
- `INSERT`-Policy + GRANT auf `collabs` für Kampagnen des eigenen Brands (über die bestehende Hilfsfunktion `brand_owns_campaign`)

Ohne dieses Snippet bleibt die Tabelle leer bzw. das Einladen scheitert mit einem RLS-Fehler.

## i18n
Alle Labels deutsch in `src/locales/de.json` unter `invite.*` (Titel, Spalten, Filter, Badges, CTA, Toasts, Leer-/Fehlertexte).
