# Influencer-Listen bleiben leer: Zugriff auf `collabs` / `creators`

## Was ich geprüft habe

Ein direkter Lesetest gegen das verbundene Supabase-Projekt (mit dem Publishable Key, also ohne Login) ergab:

- `campaigns` → HTTP 200 mit Datensätzen (Lesen funktioniert)
- `collabs` → HTTP 200, aber leeres Array
- `creators` → HTTP 200, aber leeres Array

HTTP 200 statt 403 heißt: die Data-API-GRANTs sind vorhanden, aber es kommen keine Zeilen zurück. Das hat genau zwei mögliche Ursachen, die ich ohne einen eingeloggten Test bzw. ohne dich nicht unterscheiden kann:

1. Die Tabellen `collabs` / `creators` enthalten (für diesen Brand) tatsächlich keine Daten.
2. RLS ist aktiv, es gibt aber keine SELECT-Policy, die einem eingeloggten Brand-User die relevanten Zeilen zeigt.

Wichtig: Beim Join-Query der Liste (`collabs → campaigns!inner, creators!inner`) filtert RLS auf **jeder** beteiligten Tabelle. Auch wenn `collabs` sichtbar wäre, würde ein fehlender Lesezugriff auf `creators` die Zeilen komplett herausfiltern.

## Vorgehen

### Schritt 1 — Ursache eindeutig bestimmen (zuerst)

Du führst im Supabase-SQL-Editor (dort gilt RLS nicht) aus:

```sql
select count(*) from public.collabs;
select count(*) from public.creators;
select c.status, count(*) from public.collabs c group by 1;
select tablename, policyname, cmd, roles, qual
  from pg_policies
 where schemaname = 'public' and tablename in ('collabs','creators');
```

- Counts = 0 → es fehlen schlicht Testdaten, kein Code- oder Policy-Problem.
- Counts > 0 und keine passende SELECT-Policy für `authenticated` → weiter mit Schritt 2.

### Schritt 2 — Policies nachziehen (nur falls Daten vorhanden sind)

Ich lege ein SQL-Snippet unter `.lovable/external-supabase-creators-read-policies.sql` ab, das du im Supabase-SQL-Editor ausführst. Inhalt (Entwurf, wird an die tatsächlichen Policies aus Schritt 1 angepasst):

- `collabs`: SELECT für `authenticated`, eingeschränkt auf Collabs, deren Kampagne dem Brand des eingeloggten Users gehört (`campaign_id → campaigns.brand_id → brands.user_id = auth.uid()`), gekapselt in einer `security definer`-Funktion, um Rekursion zu vermeiden.
- `creators`: SELECT für `authenticated`, eingeschränkt auf Creators, die mindestens einen Collab zu einer Kampagne dieses Brands haben (gleiche Hilfsfunktion).
- Dazu die nötigen GRANTs (`GRANT SELECT ... TO authenticated`), falls noch nicht gesetzt. Kein `anon`-Zugriff — Creator-Daten sind PII.

Da `/influencers/current` laut Spezifikation global (nicht brand-gefiltert) ist, wird diese Liste durch die brand-scoped Policy dieselben Zeilen zeigen wie die brand-gefilterten Listen. Sag Bescheid, falls „current" bewusst alle Creators projektweit zeigen soll — dann brauchen wir eine breitere Policy.

### Schritt 3 — Verifikation

Nach dem Ausführen prüfe ich die Listen `/influencers/current`, `/influencers/applied` und `/influencers/hired` eingeloggt im Preview und melde das Ergebnis. Erst dann gilt das als behoben.

## Technische Hinweise

- Keine Schema-Änderungen, keine Lovable Cloud, keine Migration durch mich — das externe Projekt (rssnbsduduboxlrvpodw) wird ausschließlich per SQL-Snippet von dir angepasst.
- Am Frontend-Code (`src/lib/creators-list.ts`, `CreatorsTable.tsx`) ist voraussichtlich keine Änderung nötig; falls Schritt 1 zeigt, dass die Daten anders verknüpft sind als angenommen, passe ich den Join dort an.
