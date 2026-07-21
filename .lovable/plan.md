## Ursache

`src/routes/_authenticated/index.tsx` fragt `campaigns.name` ab. In der externen DB heisst die Spalte aber `title` → PostgREST liefert 400 `column campaigns.name does not exist`, der Suspense-Query wirft, die Error-Boundary blockiert `/`.

Solange kein Campaigns-Record existierte, war die Liste leer und der Fehler fiel nicht auf (Query lief trotzdem — hat aber vermutlich schon vorher bei jedem Aufruf 400 geworfen; auffällig wurde es nach dem ersten Anlegen).

## Änderungen

1. `src/routes/_authenticated/index.tsx`
   - Select: `id, title, status, start, ende, budget`
   - Rendering: `c.name` → `c.title` in Tabellenzeilen / Fallback-Text.

2. `src/integrations/supabase/types.ts`
   - Feld `name: string` in `campaigns.Row/Insert/Update` durch `title: string` ersetzen (Types wieder mit realem Schema synchron; keine Schemaänderung in Supabase).

Keine Backend-/Migrations-Änderungen, kein Cloud-Enable.