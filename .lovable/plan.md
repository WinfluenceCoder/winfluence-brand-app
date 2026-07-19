## Ursache

Der Fehler kommt aus der externen RPC `get_email_status`, nicht aus dem Frontend:

```
400  POST /rest/v1/rpc/get_email_status
{"code":"42804","message":"structure of query does not match function result type",
 "details":"Returned type brand_status does not match expected type text in column 3."}
```

Die Spalte `brands.status` ist ein Postgres-Enum-Typ namens `brand_status`. Die RPC deklariert Spalte 3 aber als `text`. Postgres castet Enums nicht implizit auf `text`, daher 42804.

Folgeeffekt im UI: `checkEmailStatus` fängt den Fehler ab und gibt `{ authExists:false, invitedDomain:null, brandStatus:null }` zurück. Bei Register läuft es dann in `supabase.auth.signUp` — aber vorher zeigt vermutlich der `console.warn("get_email_status error", …)` als "leeres {}" (Supabase-Error-Objekte serialisieren mit `JSON.stringify` zu `{}`, weil die Felder non-enumerable sind). Das erklärt exakt die Meldung "Fehlermeldung leer {}".

## Fix (extern in Supabase, kein Code-Change)

`get_email_status` muss `b.status` auf `text` casten. Ansonsten wie im letzten Plan:

```sql
create or replace function public.get_email_status(p_email text)
returns table (auth_exists boolean, invited_domain text, brand_status text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
begin
  return query
  select
    exists (select 1 from auth.users u where lower(u.email) = v_email) as auth_exists,
    (select b.domain from public.brands b
       where lower(b.e_mail_address) = v_email
         and b.status = 'invited'
       limit 1) as invited_domain,
    (select b.status::text from public.brands b   -- ← Cast auf text
       where lower(b.e_mail_address) = v_email
       order by b.created_at desc nulls last
       limit 1) as brand_status;
end;
$$;

grant execute on function public.get_email_status(text) to anon, authenticated;
```

Alternativ die `returns table`-Signatur auf `brand_status brand_status` ändern — Cast auf `text` ist robuster, weil das Frontend den Wert bereits als String behandelt.

## Frontend

Keine Änderungen. Sobald die RPC-Signatur passt, funktionieren Register/Login wie im letzten Plan (Blockieren für `deleted`/`suspended`, Redirect für `invited`, sonst normaler Auth-Call).

## Verifikation nach dem externen Fix

1. `POST /rpc/get_email_status` mit `{"p_email":"neu@example.com"}` → 200, `brand_status: null`.
2. Register mit neuer E-Mail → `signUp` läuft durch, kein 400 mehr auf der RPC.
3. Register/Login mit `deleted`/`suspended` Brand → Toast, kein Auth-Call.
4. Login mit `invited` Brand → Redirect `/welcome?domain=…`.
