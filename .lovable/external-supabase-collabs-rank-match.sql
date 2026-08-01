-- Externes Supabase-Projekt: rssnbsduduboxlrvpodw
-- Für /campaigns/curate/$id benötigt: collabs.rank und collabs.match
-- Im SQL-Editor des externen Projekts ausführen.

alter table public.collabs
  add column if not exists rank integer,
  add column if not exists match integer;

-- Schreibrechte für die BrandApp (Statuswechsel + Rank-Reihenfolge).
grant select, update on public.collabs to authenticated;

-- UPDATE-Policy: ein Brand darf collabs seiner eigenen Kampagnen ändern.
drop policy if exists "brand can update own campaign collabs" on public.collabs;
create policy "brand can update own campaign collabs"
on public.collabs
for update
to authenticated
using (
  exists (
    select 1
    from public.campaigns c
    join public.brands b on b.id = c.brand_id
    where c.id = collabs.campaign_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.campaigns c
    join public.brands b on b.id = c.brand_id
    where c.id = collabs.campaign_id
      and b.user_id = auth.uid()
  )
);
