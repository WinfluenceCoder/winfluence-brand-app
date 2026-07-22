## Ziel
Profil-Vollständigkeit dynamisch berechnen, beim Speichern in `brands.profile_quality` schreiben und auf dem Dashboard anzeigen.

## Formel
- `R` = Spaltenanzahl von `public.brands`, dynamisch ermittelt via
  ```sql
  SELECT COUNT(*) AS col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'brands';
  ```
- `N` = Anzahl Felder im Brand-Record mit Wert `!== null` (und nicht leerer String)
- `V = clamp(round(N / R * 100), 1, 100)` → integer, garantiert 1..100

## Änderungen

### 1) Neuer RPC in externem Supabase (SQL-Snippet als Dokumentation)
Datei `.lovable/external-supabase-brands-column-count.sql` mit:
```sql
create or replace function public.get_brands_column_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from information_schema.columns
  where table_schema = 'public' and table_name = 'brands';
$$;
grant execute on function public.get_brands_column_count() to authenticated;
```
Hinweis für User: dieses SQL im Supabase-SQL-Editor ausführen (keine Cloud-Aktivierung, keine automatische Migration).

### 2) `src/lib/brands.functions.ts`
- Helper `computeProfileQuality(row, colCount)`:
  - zählt Keys mit `value !== null && value !== undefined && value !== ""`
  - `v = Math.round(n / colCount * 100)`
  - `return Math.min(100, Math.max(1, v))`
- In `updateMyBrand`:
  1. `UPDATE brands ... RETURNING *`
  2. `context.supabase.rpc("get_brands_column_count")` → `R` (Fallback auf `Object.keys(row).length`, falls RPC fehlt)
  3. `profile_quality` berechnen und per zweitem `UPDATE` in `brands.profile_quality` schreiben
  4. Row inkl. `profile_quality` zurückgeben

### 3) `src/routes/_authenticated/index.tsx`
- Zweiten Suspense-Query hinzufügen, der `profile_quality` (und ggf. `id`) aus `brands` liest.
- Zwischen `<h1>Mein Dashboard</h1>` und der Kampagnen-Card neuen Block einfügen:
  - **Willkommens-Nachricht** (`home.welcome`) — sichtbar solange `profile_quality < 80`
  - **Profil-Fortschritt** — sichtbar solange `profile_quality < 100`, eine Zeile über volle Breite (`flex items-center gap-4 w-full`):
    - Label „Mein Profil:"
    - `<Progress>` aus `@/components/ui/progress` (ggf. via shadcn hinzufügen), Wert = `profile_quality ?? 1`, `flex-1`
    - Prozent-Text („42 %")
    - Button „Profil vervollständigen" → `Link to="/profile"` (nur wenn `< 100`)
- Bei `profile_quality >= 100`: Block komplett ausgeblendet.

### 4) `src/locales/de.json`
Neue Keys unter `home`:
- `welcome`
- `profileLabel` = „Mein Profil:"
- `completeProfile` = „Profil vervollständigen"

## Technische Notizen
- Kein Schema-Change (`profile_quality` existiert bereits).
- Clamp stellt sicher: 1 ≤ V ≤ 100.
- RPC-Fallback verhindert Crash, falls das SQL-Snippet noch nicht ausgeführt wurde.