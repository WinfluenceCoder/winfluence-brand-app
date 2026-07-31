# Influencer-Liste (CreatorList)

Wiederverwendbare Influencer-Tabelle analog zur bestehenden Kampagnen-Liste, gespeist aus den bestehenden Tabellen `creators` und `collabs` (nur lesend, externes Supabase-Projekt, keine Migrationen).

## Wichtiger Befund zum Datenmodell

`collabs` hat **keine** Spalte `brand_id`. Die Brand-Zuordnung läuft über `collabs.campaign_id → campaigns.brand_id`. Der Brand-Filter wird deshalb als Join-Filter über die Kampagnen des aktuellen Brands umgesetzt (Brand-Ermittlung wie in `src/lib/campaigns-list.ts` über die eingeloggte User-ID).

Verfügbare Creator-Felder: `foto_url`, `nick_name`, `e_mail_address`, `mobile`, `insta_url`, `tiktok_url`, `youtube_url`, `linkedin_url`, `first_name`, `last_name`, `status`. Follower-Zahlen existieren nicht in der DB → Platzhalter 1234, formatiert mit `toLocaleString("de-CH")`.

## Umfang

**Datenquelle** (`src/lib/creators-list.ts`)
- Query-Options `creatorsListQueryOptions({ status, brandScoped })`.
- Lädt `collabs` mit eingebettetem `creators` und `campaigns(brand_id)`, filtert auf `status in (...)` und optional auf die Kampagnen des aktuellen Brands.
- Dedupliziert pro Creator (erster/aktuellster Collab-Status gewinnt), liefert flache Zeilen inkl. `collabStatus`.

**Komponente** (`src/components/app/CreatorsTable.tsx`)
- Spalten: Avatar (rund), Nickname, E-Mail (`mailto:`), Mobile, Instagram / TikTok / YouTube (Icon-Link + Follower-Platzhalter), LinkedIn (nur Icon-Link), Status-Badge, Drei-Punkte-Menü.
- Social-Icons werden ausgeblendet, wenn die URL NULL ist; alle externen Links `target="_blank" rel="noopener noreferrer"`.
- Status-Spaltenkopf ist ein Select-Filter (gleiche Optik wie in `CampaignsTable`), optional per Prop.
- Dropdown-Menü: Instagram, TikTok, YouTube, LinkedIn (jeweils deaktiviert bei NULL), Separator, „Nachricht schicken" (deaktiviert).
- Zeilenklick navigiert nach `/influencers/$id`; Links und Menü stoppen die Propagation.
- Leer- und Ladezustand analog Kampagnen-Liste.

**Routen**
- `/influencers/current` (bestehend, Platzhalter ersetzen): Status `applied` + `hired`, ohne Brand-Filter.
- `/influencers/applied` (neu): Status `applied`, auf aktuellen Brand eingeschränkt.
- `/influencers/hired` (bestehend, Platzhalter ersetzen): Status `hired`, auf aktuellen Brand eingeschränkt.
- `/influencers/$id` (neu): Read-only-Detailseite mit den Creator-Feldern (Foto, Name, Nickname, Kontakt, Social-Links, Status).

**Navigation & i18n**
- Neuer Sidebar-Eintrag „Bewerbungen" (`nav.influencersApplied`) in der Influencer-Gruppe, zwischen „Aktuelle" und „Engagierte".
- Alle Labels (Spaltenköpfe, Status-Labels, Menü-Einträge, Leerzustand, Detailseite) in `src/locales/de.json` unter `creatorsList.*`.

## Technisch

- Nur Lesezugriffe über den bestehenden Client `@/integrations/supabase/client`; TanStack Query mit Loader-Prefetch wie bei den Kampagnen-Routen.
- shadcn/ui: Table, Badge, Avatar, DropdownMenu, Select; Icons aus `lucide-react` (TikTok hat kein Lucide-Icon → schlichtes Inline-SVG bzw. `Music2` als Ersatz, Standard: Inline-SVG im TikTok-Stil).
- Keine Backend-Änderungen. Falls RLS auf `creators`/`collabs` Brand-Nutzern keinen Lesezugriff gewährt, bleiben die Listen leer — das wäre dann separat in Supabase zu prüfen.
