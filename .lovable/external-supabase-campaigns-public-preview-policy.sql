-- Öffentliche Leseansicht für /campaigns/preview/:id
-- Im Supabase-Dashboard (Projekt rssnbsduduboxlrvpodw) im SQL-Editor ausführen.
-- Erlaubt anonymen Besuchern das Lesen von Kampagnen, die nicht 'draft' sind.

grant select on public.campaigns to anon;

drop policy if exists "public can read non draft campaigns" on public.campaigns;

create policy "public can read non draft campaigns"
on public.campaigns
for select
to anon
using (status::text <> 'draft');
