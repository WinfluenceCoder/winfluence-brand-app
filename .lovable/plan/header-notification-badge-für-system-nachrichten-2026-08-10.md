# Header: Notification-Badge für System-Nachrichten

## Ziel
Im App-Header soll das Glocken-Icon (Bell) die Anzahl der ungelesenen System-Nachrichten als Count-Badge anzeigen. Ein Klick führt auf `/messages?type=system`.

## Änderungen

### 1. `src/components/app/AppHeader.tsx`
- `useQuery` von `@tanstack/react-query` importieren.
- `unreadCountsQueryOptions` aus `@/lib/messages` importieren.
- Hook `const { data: unread } = useQuery(unreadCountsQueryOptions())` verwenden.
- Den bestehenden Bell-Button mit Badge versehen: `unread?.system ?? 0` als Count.
- Den Bell-Link von `/messages/notifications` auf `/messages` mit `search={{ type: "system" }}` ändern.
- Wenn Count 0 ist, kein Badge anzeigen.

### 2. Keine weiteren Dateien
- Keine Schema-Änderungen, keine Migrationen, keine Backend-Logik.
- `unreadCountsQueryOptions` in `src/lib/messages.ts` existiert bereits und liefert den passenden `system`-Zähler.

## Prüfung danach
- Typecheck: `tsgo --noEmit`.
- Vier Fälle testen: kein Badge bei 0, Badge bei 1+, Klick springt auf `/messages?type=system`, bestehende Header-Elemente (Settings, Profil-Dropdown) bleiben unverändert.
