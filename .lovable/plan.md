CampaignCard auf /curate erweitern

## Ziel
Die `CampaignCard` auf `/campaigns/curate/$id` soll:
1. Den Briefing-Text auf maximal 9 Zeilen begrenzen.
2. Oben rechts einen Button "Live Version anzeigen" mit einem externen Link-Icon erhalten, der auf `/campaigns/preview/$id` verweist — aber nur, wenn der Kampagnenstatus nicht `draft` ist.


## Aktueller Stand
- `src/components/app/CampaignCard.tsx` zeigt Titel, Bild und unbeschränkten Briefing-Text.
- `src/routes/_authenticated/campaigns.preview.$id.tsx` existiert bereits als Platzhalter.
- `campaignForm.viewLive` ist bereits in `src/locales/de.json` vorhanden.
- Das Link-Icon kann aus `lucide-react` als `ExternalLink` importiert werden.

## Geplante Änderungen
1. **CampaignCard: Props für Campaign-ID und Status ergänzen**
   - `CampaignCardData` bleibt gleich; zusätzlich werden `id` (number) und `status` (string | null) übergeben.
   - `id` parametrisiert den Link nach `/campaigns/preview/$id`.
   - `status` steuert die Sichtbarkeit des Buttons: `draft` blendet ihn aus; alle anderen Stati zeigen ihn.
2. **Button "Live Version anzeigen" oben rechts (bedingt)**
   - In `CampaignCard` wird der `CardHeader` neben dem Titel um einen `Link` aus `@tanstack/react-router` erweitert.
   - Button-Variante: `outline` oder `ghost`, Icon `ExternalLink` (Lucide), Text-Key `campaignForm.viewLive`.
   - Layout: Header mit `justify-between` / `flex`/`items-center`, damit Titel links und Button rechts stehen.
   - Nur rendern, wenn `status !== "draft"`.
3. **Briefing-Text auf 9 Zeilen begrenzen**
   - Dem `<p>`-Element, das das Briefing rendert, wird `line-clamp-9` hinzugefügt (Tailwind-CSS line-clamp).
   - Kein "Mehr anzeigen"-Toggle vorgesehen.
4. **Aufrufende Route anpassen**
   - `src/routes/_authenticated/campaigns.curate.$id.tsx` übergibt `id` (campaignId) und `status` (aus dem Campaign-Query) zusätzlich an `CampaignCard`.
5. **Keine Schema- oder Backend-Änderungen**
   - Keine Datenbank-Migration, keine Server-Funktionen, keine API-Calls.


## Akzeptanzkriterien
- Auf `/campaigns/curate/$id` wird rechts im Card-Header ein Button mit Icon "Live Version anzeigen" angezeigt, sofern `status !== "draft"`.
- Bei `status === "draft"` fehlt der Button im Header komplett; der Rest der Card bleibt unverändert.
- Klick auf den Button navigiert zu `/campaigns/preview/$id`.
- Der Briefing-Text wird nach 9 Zeilen mit Ellipse abgeschnitten.
- Keine Broken-Link/Type-Fehler im Build.

