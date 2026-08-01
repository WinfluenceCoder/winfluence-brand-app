-- Externes Supabase-Projekt: rssnbsduduboxlrvpodw
-- Für /campaigns/curate/$id benötigt: collabs.rank, collabs.match
-- sowie eine UPDATE-Policy für Brands auf collabs.
-- Im SQL-Editor des externen Projekts ausführen.

-- ---------------------------------------------------------------------------
-- SCHRITT 1 — Diagnose (nur lesen, gefahrlos)
-- Zeigt bestehende Policies und Rechte auf public.collabs.
-- ---------------------------------------------------------------------------
select policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'collabs'
order by cmd, policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'collabs'
order by grantee, privilege_type;

-- ---------------------------------------------------------------------------
-- SCHRITT 2 — Spalten
-- ---------------------------------------------------------------------------
alter table public.collabs
  add column if not exists rank integer,
  add column if not exists match integer;

-- ---------------------------------------------------------------------------
-- SCHRITT 3 — Besitzprüfung als SECURITY DEFINER Funktion
-- Vermeidet, dass die Policy von den RLS-Regeln von campaigns/brands abhängt.
-- ---------------------------------------------------------------------------
create or replace function public.brand_owns_campaign(_campaign_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.campaigns c
    join public.brands b on b.id = c.brand_id
    where c.id = _campaign_id
      and b.user_id = auth.uid()
  )
$$;

revoke all on function public.brand_owns_campaign(bigint) from public;
grant execute on function public.brand_owns_campaign(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- SCHRITT 4 — Rechte + UPDATE-Policy (ergänzend, entfernt keine fremden Rechte)
-- ---------------------------------------------------------------------------
grant select, update on public.collabs to authenticated;

drop policy if exists "brand can update own campaign collabs" on public.collabs;
create policy "brand can update own campaign collabs"
on public.collabs
for update
to authenticated
using (public.brand_owns_campaign(campaign_id))
with check (public.brand_owns_campaign(campaign_id));

-- ---------------------------------------------------------------------------
-- SCHRITT 5 — Kontrolle
-- Erwartet: true für eine Kampagne der eigenen Brand.
-- (Im SQL-Editor läuft die Abfrage als Service-Rolle, auth.uid() ist dort NULL —
--  die eigentliche Prüfung erfolgt in der App über /campaigns/curate/$id.)
-- ---------------------------------------------------------------------------
select policyname, cmd, roles, with_check
from pg_policies
where schemaname = 'public' and tablename = 'collabs' and cmd = 'UPDATE';
