## Ziel

Brands mit `status IN ('deleted', 'suspended')` sollen sich nicht mehr einloggen (und nicht neu registrieren) können. Stattdessen: klare Fehlermeldung, kein `signInWithPassword`-/`signUp`-Call.

## Extern in Supabase (du erledigst)

`get_email_status` erweitern, damit sie zusätzlich den Brand-Status zurückgibt:

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
    (select b.status from public.brands b
       where lower(b.e_mail_address) = v_email
       order by b.created_at desc nulls last
       limit 1) as brand_status;
end;
$$;

grant execute on function public.get_email_status(text) to anon, authenticated;
```

Keine PII zusätzlich — nur der eigene Status-String.

## Frontend (`src/routes/login.tsx`)

`checkEmailStatus` liefert jetzt zusätzlich `brandStatus: string | null`. Typing entsprechend erweitern.

### Neue Prüfreihenfolge

**`onLogin`** (nach Zod, nach `checkEmailStatus`):
1. `invitedDomain` → wie bisher: Redirect `/welcome?domain=…`.
2. **NEU**: `brandStatus === 'deleted' || 'suspended'` → Toast `auth.errors.accountDeleted` bzw. `auth.errors.accountSuspended`, **kein** `signInWithPassword`.
3. Sonst normaler Login.

**`onRegister`** (nach Zod, nach `checkEmailStatus`):
1. `invitedDomain` → wie bisher.
2. **NEU**: `brandStatus === 'deleted' || 'suspended'` → gleiche Toast-Meldung, **kein** `signUp`.
3. Sonst `authExists`-Zweig wie bisher, sonst normaler `signUp`.

**`onForgot`**: unverändert (kein Enumeration-Leak — Reset-Mail wird weiterhin unabhängig verschickt).

### i18n (`src/locales/de.json` → `auth.errors`)

- `accountDeleted`: „Dieses Konto wurde gelöscht. Bitte kontaktiere das Team, falls das ein Fehler ist."
- `accountSuspended`: „Dieses Konto ist aktuell gesperrt. Bitte kontaktiere das Team."

## Nicht Teil dieses Plans

- Kein Force-Logout für bereits eingeloggte Sessions (bei nächstem Reload greift ohnehin RLS/Serverlogik; separates Thema).
- Keine Änderung an `welcome.tsx` oder `claim-brand`.
- Kein Passwort-Reset-Enumeration-Change.

## Verifikation

1. Login mit E-Mail einer `deleted` Brand → Toast, kein Auth-Call im Network-Tab.
2. Login mit E-Mail einer `suspended` Brand → Toast, kein Auth-Call.
3. Register mit denselben E-Mails → gleiche Toasts, kein `signUp`.
4. Login/Register mit `active` Brand → unverändert.
5. Login/Register mit `invited` Brand → Redirect `/welcome` (Vorrang vor Status-Check).
