# Kampagnen-Preview: öffentliche Leseansicht

Ziel: `/campaigns/preview/:id` wird eine login-freie, rein lesende, ruhig gestaltete Kampagnenseite im Stil der öffentlichen Winfluence-Seiten – ohne Sidebar, ohne App-Header, ohne Aktionen (außer «Schliessen»).

## Was gebaut wird

**1. Route wird öffentlich**
- Neue öffentliche Route `src/routes/campaigns.preview.$id.tsx` (kein `_authenticated`).
- Die bisherige Platzhalter-Route unter `_authenticated` wird entfernt, damit es nur eine Preview-Adresse gibt. Die URL `/campaigns/preview/$id` bleibt identisch – alle bestehenden Links (Kontextmenü, CampaignCard, Publish-Seite) funktionieren unverändert.

**2. Datenzugriff (nur lesend)**
- Ein einzelner `select` auf `public.campaigns` per `id` über den bestehenden externen Supabase-Client, via TanStack Query (`useQuery`).
- Kein Server-Function, keine Migration, keine neuen Backend-Ressourcen.
- Hinweis: Für anonyme Besucher braucht die Tabelle eine öffentliche SELECT-Policy in deiner externen Datenbank. Ich lege dir dafür ein SQL-Snippet unter `.lovable/external-supabase-campaigns-public-preview-policy.sql` ab (Lesen nur für Kampagnen, die nicht `draft` sind, plus `GRANT SELECT ... TO anon`). Du führst es selbst im Supabase-Dashboard aus. Eingeloggte Nutzer sehen die Seite auch ohne dieses Snippet.

**3. Seitenaufbau**
- Sticky weißer Header mit dezenter Trennlinie: links nur das Winfluence-Logo (`src/assets/winfluence-logo.png`), rechts ein dezenter Ghost-Button «Schliessen» (`window.close()`).
- Inhalt zentriert, `max-w-4xl`, viel Weißraum, Roboto als Seiten-Schrift.
- Hero: `campaign_visual_url` als `aspect-video`, abgerundet, `object-cover`; Fallback dezenter Gradient. Darunter rundes `brand_logo_url` + `brand_name`, dann `title` als H1 (700), Status-Badge (Entwurf grau, Veröffentlicht/Freigegeben blau, Laufend grün, Abgelaufen/Beendet amber, Archiviert grau) und neutraler `type`-Badge.
- Eckdaten-Grid mit lucide-Icons: Zeitraum (`start` – `ende`), Bewerbung bis (`apply_till`), Budget (CHF, de-CH, ohne Rappen), Barter-Wert (CHF). Mobil 1 Spalte, ab `sm` 2 Spalten, Desktop 4.
- Detail-Sektionen mit kleinen Zwischenüberschriften (500) und dezenten Trennlinien: Produkt, Ziel, Zielgruppe, Kernbotschaft (als hervorgehobener Zitat-Block), Briefing (`whitespace-pre-line`), Anforderungen, Post-Typ.
- Hashtags & Links: `hashtags` als Pill-Chips, `link_list` und `target_url` als schlichte Textlinks, `coupon` in Monospace-Box (nur Anzeige).
- Barter-Karte (nur wenn mindestens ein Barter-Feld gefüllt): Beschreibung, Wert, Bestell-Link, Bestell-Coupon; Fußzeile klein/grau «Erstellt am … · Aktualisiert am …» (dd.MM.yyyy).

**4. Verhalten**
- Leere/`null`-Felder: Sektion komplett ausblenden.
- Ladezustand: Skeletons im gleichen Layout. Fehler/nicht gefunden: freundliche Meldung «Kampagne nicht gefunden», keine Aktionen.
- Alle Texte auf Deutsch über `de.json` unter `campaigns.preview.*`.

## Technische Details

- Roboto wird per `<link>` im Root-Route-Head geladen und über ein `--font-roboto`-Theme-Token in `src/styles.css` nutzbar gemacht; angewendet nur auf den Preview-Container, damit andere Seiten unverändert bleiben.
- Datums-/Währungsformatierung als kleine lokale Helper (`Intl.DateTimeFormat('de-CH')`, `Intl.NumberFormat('de-CH', { currency: 'CHF', maximumFractionDigits: 0 })`).
- Nur shadcn/ui-Bausteine (Card, Badge, Button, Skeleton, Separator) und bestehende Design-Tokens; keine hartcodierten Farben.
- Berührte Dateien: neue `src/routes/campaigns.preview.$id.tsx`, Löschung von `src/routes/_authenticated/campaigns.preview.$id.tsx`, `src/locales/de.json`, `src/routes/__root.tsx` (Font-Link), `src/styles.css` (Font-Token), neues SQL-Snippet in `.lovable/`.
