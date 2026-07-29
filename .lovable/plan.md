## Diagnose
Die Startseite crasht mit `JSON object requested, multiple (or no) rows returned`. Zwei Brand-Abfragen filtern nicht auf den eingeloggten Nutzer und verwenden `maybeSingle()`, das bei mehr als einer sichtbaren Zeile einen Fehler wirft:

- `src/routes/_authenticated/index.tsx:32-35` — `from("brands").select("profile_quality").maybeSingle()`
- `src/lib/campaigns-list.ts:32` — `from("brands").select("id").maybeSingle()`

Im Layout `src/routes/_authenticated/route.tsx:33` ist der Filter `.eq("user_id", user.id)` vorhanden — dort tritt der Fehler nicht auf. Das bestätigt: sobald über RLS mehr als eine `brands`-Zeile sichtbar ist, brechen genau die beiden ungefilterten Abfragen.

## Fix
1. **`src/routes/_authenticated/index.tsx`** — Profile-Quality-Query: aktuelle Auth-User-ID holen (`supabase.auth.getUser()`) und `.eq("user_id", user.id)` ergänzen; zusätzlich `.limit(1)` vor `maybeSingle()` als Absicherung. QueryKey um die User-ID erweitern.
2. **`src/lib/campaigns-list.ts`** — Brand-Lookup analog auf `.eq("user_id", user.id).limit(1).maybeSingle()` umstellen; ohne User keine Kampagnen laden (leere Liste statt Fehler).
3. **Fehlerrobustheit**: Wenn kein Brand-Datensatz gefunden wird, weiterhin Default (`profile_quality = 1`, leere Kampagnenliste) statt Exception, damit die Startseite auch für frisch angelegte Nutzer rendert.

## Nicht enthalten
- Keine Schema- oder RLS-Änderungen im externen Supabase-Projekt. Falls tatsächlich mehrere `brands`-Zeilen pro Nutzer existieren, ist das ein Datenthema, das separat geprüft werden sollte — der Fix macht die App dagegen robust.
