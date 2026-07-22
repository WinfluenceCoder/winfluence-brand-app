-- Run in the external Supabase SQL editor (project rssnbsduduboxlrvpodw).
-- Returns the number of columns in public.brands so profile completeness
-- (V = round(N / R * 100)) stays correct when the schema evolves.

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
