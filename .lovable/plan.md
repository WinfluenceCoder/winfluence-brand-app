## Ziel

Zwei neue Vor-Prüfungen in Login/Register:

1. **Registrieren mit bereits verknüpfter E-Mail** → Fehlermeldung + zurück auf Login-Tab.
2. **Login oder Register mit E-Mail, für die ein `brands`-Record mit `status = 'invited'` existiert** → Weiterleitung auf `/welcome?domain=<brands.domain>`.

## Extern in Supabase (du erledigst)

Neue RPC im Projekt `rssnbsduduboxlrvpodw`:

```sql
create or replace function public.get_email_status(p_email text)
returns table (auth_exists boolean, invited_domain text)
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
       limit 1) as invited_domain;
end;
$$;

grant execute on function public.get_email_status(text) to anon, authenticated;
```

Rückgabe: genau eine Zeile mit beiden Feldern. Kein PII-Leak (nur bool + eigene Domain).

## Frontend-Umsetzung (`src/routes/login.tsx`)

Kleine Helper-Funktion `checkEmailStatus(email)` im Modul, die die RPC aufruft und `{ authExists, invitedDomain }` liefert (mit sicherem Fallback bei Netzwerkfehler: leere Werte, damit der normale Flow weiterläuft).

### Reihenfolge in `onLogin`
1. Zod-Validierung (unverändert).
2. `checkEmailStatus`.
3. Wenn `invitedDomain` → `navigate({ to: "/welcome", search: { domain: invitedDomain } })` und Toast „Bitte schließe zuerst die Einladung ab." — kein `signInWithPassword`.
4. Sonst normaler `signInWithPassword`-Ablauf.

### Reihenfolge in `onRegister`
1. Zod-Validierung.
2. `checkEmailStatus`.
3. Wenn `invitedDomain` → Weiterleitung auf `/welcome?domain=…` (gleiche Behandlung wie Login).
4. Sonst wenn `authExists` → Toast `auth.errors.emailAlreadyRegistered` + `setMode("login")` + `loginForm.setValue("email", v.email)`; kein `signUp`.
5. Sonst normaler `signUp`-Ablauf (bestehender `user_already_exists`-Mapper bleibt als Sicherheitsnetz).

### i18n (`src/locales/de.json`)
Neue Keys unter `auth.errors`:
- `emailAlreadyRegistered`: „Diese E-Mail ist bereits registriert. Bitte melde dich an."
- `pendingInvite`: „Für diese E-Mail liegt eine Einladung vor. Bitte schließe zuerst die Registrierung ab."

## Nicht Teil dieses Plans

- Kein Passwort-vergessen-Flow-Change (Behavior bleibt: Reset-Link wird auch für unbekannte E-Mail versendet, um Enumeration zu vermeiden — dort keine Vorprüfung).
- Keine Änderung an `claim-brand` oder `welcome.tsx`.
- Kein neuer Trigger, keine Anpassung von `handle_new_user`.

## Verifikation

1. Register mit E-Mail eines bestehenden Auth-Users → Toast + Wechsel auf Login-Tab, E-Mail vorausgefüllt, kein `signUp`-Call im Network-Tab.
2. Login/Register mit E-Mail einer invited Brand → Redirect auf `/welcome?domain=<domain>`, kein Auth-Call.
3. Login mit normalem Bestandsnutzer → funktioniert wie bisher.
4. Register mit komplett neuer E-Mail → funktioniert wie bisher (Confirm-Mail).
