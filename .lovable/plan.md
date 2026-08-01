# RLS-Fehler beim Verschieben in «ausgewählt sind» beheben

Beim Drag nach links schreibt die App `collabs.status = 'selected'` und danach `collabs.rank`. Die Datenbank lehnt das mit `new row violates row-level security policy for table "collabs" | code: 42501` ab — es fehlt also eine passende UPDATE-Policy (bzw. deren `WITH CHECK` trifft nicht zu).

## Was geprüft wurde

- Der angemeldete Nutzer besitzt Brand `id = 1` (`brands.user_id = auth.uid()`, Status `active`) und darf `brands` sowie `campaigns` lesen; die Kampagnen 1, 2, 5, 6 gehören dieser Brand.
- Die Besitzkette Brand → Kampagne → Collab ist damit aus der App heraus nachvollziehbar; die Ursache liegt nicht in fehlenden Leserechten.
- Ob die UPDATE-Policy aus `.lovable/external-supabase-collabs-rank-match.sql` im externen Projekt tatsächlich existiert, lässt sich von hier aus nicht abfragen. Das ist die wahrscheinlichste Ursache, bleibt aber unbestätigt und wird als erster Schritt verifiziert.

## Schritt 1 — Verifizieren (du, im SQL-Editor)

Ich stelle im SQL-Snippet eine kurze Prüfabfrage bereit, die zeigt:

- welche Policies auf `public.collabs` existieren (Name, Kommando, permissive/restrictive, Rolle),
- welche Rechte `authenticated` auf `collabs` hat.

Ergebnis entscheidet: fehlende Policy → Schritt 2; existierende, aber restriktive Policy einer anderen App → wir passen den Namen/Bedingung gezielt an, ohne fremde Policies zu löschen.

## Schritt 2 — Rekursionsfreie, robuste UPDATE-Policy

`.lovable/external-supabase-collabs-rank-match.sql` wird so umgebaut, dass die Policy nicht mehr von den RLS-Regeln fremder Tabellen abhängt:

- neue Hilfsfunktion `public.brand_owns_campaign(_campaign_id bigint) returns boolean`, `language sql`, `stable`, `security definer`, `set search_path = public` — prüft intern `campaigns` join `brands` auf `brands.user_id = auth.uid()`;
- `grant execute` nur an `authenticated`;
- Policy `brand can update own campaign collabs` für `update to authenticated` mit `using (public.brand_owns_campaign(campaign_id))` und identischem `with check`;
- `grant select, update on public.collabs to authenticated` bleibt (nur ergänzend, keine bestehenden Rechte entfernen).

Damit greift die Prüfung auch dann, wenn `campaigns`/`brands` künftig strenger abgesichert werden.

## Schritt 3 — Verifikation nach dem Ausführen

Nach dem Einspielen: in `/campaigns/curate/$id` eine Card nach links ziehen und den persistierten Zustand kontrollieren (Status `selected`, `rank` 1..n neu geschrieben, keine Toast-Fehlermeldung), danach eine Card zurück nach rechts. Ich prüfe das aus dem eingeloggten Preview heraus und melde das Ergebnis; bleibt der Fehler, liefert der Policy-Report aus Schritt 1 die nächste Spur.

## Kein Code-Umbau nötig

Die App-Logik in `src/lib/campaign-curation.ts` (Status- und Rank-Updates über den bestehenden externen Client) bleibt unverändert. Kein Lovable Cloud, keine Schema-Änderung ausser der bereits vereinbarten Policy/Funktion.
