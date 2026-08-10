# Nachrichten-Inbox: Route /messages

Eine Outlook-artige Inbox mit Master-Detail-Layout, Filter über die URL und Ungelesen-Badges in der Sidebar. Nur Lesen und Status-Updates auf der bestehenden Tabelle `messages` — keine Backend- oder Schema-Änderungen.

## Was entsteht

**Route `/messages` (im bestehenden App-Layout)**
- Tabs oben: Alle, Notifikationen (system), Persönliche (user), Winfluence (moderator); Auswahl schreibt `?type=…`, aktiver Tab wird aus der URL abgeleitet. Kleines Badge je Tab mit Anzahl ungelesener Nachrichten.
- Linke Spalte (ca. 400 px): Liste mit rundem Absender-Thumbnail (32–36 px), Absender-Bezeichnung, Betreff, erste Body-Zeile (gekürzt), relative Zeit («vor 2 Std.», ältere als Datum). Ungelesene ausschliesslich fett. Prio hoch = rotes Ausrufezeichen, Prio tief = gedämpfter Pfeil nach unten, normal = kein Icon. Ausgewählte Zeile im Selected-State. Loading-Skeletons und Empty State je Filter.
- Rechte Spalte: Header mit Thumbnail, Betreff, Absender, vollständigem Datum, Prio-Kennzeichnung; darunter der Body als Plaintext mit erhaltenen Zeilenumbrüchen. Toolbar mit «Als ungelesen markieren», «Löschen» (Soft-Delete mit Bestätigungsdialog) und «Aktualisieren». Ohne Auswahl ein Platzhalter.
- Unter md einspaltig: Liste als Vollbild, Klick öffnet die Detailansicht mit Zurück-Button.
- Öffnen einer neuen Nachricht setzt den Status optimistisch auf gelesen (Rollback bei Fehler), Badges aktualisieren sich per Query-Invalidation.
- Ausgewählte Nachricht steht als `&id=…` in der URL, damit Deep-Links funktionieren.

**Absender-Darstellung**
- system → beigelegtes Icon + «Winfluence System»
- moderator → beigelegtes Icon + «Winfluence Team»
- user → Avatar des Absenders (aus `creators.foto_url` über `from_user_id`), sonst Initialen-Fallback; Name aus Nickname bzw. Vor-/Nachname, sonst generischer Fallback

**Sidebar**
- Gruppe «Nachrichten» mit den drei Unterpunkten Notifikationen, Persönliche, Winfluence, verlinkt auf `/messages?type=…`. Aktiv-Zustand berücksichtigt den `type`-Parameter. Je Eintrag ein Badge mit der Anzahl ungelesener Nachrichten dieses Typs.

**Alte Routen**
- `/messages/notifications`, `/messages/personal`, `/messages/system` werden zu Redirects auf die passenden `/messages?type=…`-URLs, damit Bookmarks weiter funktionieren.

## Technische Details

- Neues Datenmodul `src/lib/messages.ts` mit den Query-Options: Liste (`to_user_id = auth.uid()`, `status != 'deleted'`, `sent_at` absteigend, `type`-Filter serverseitig via `.eq`), Ungelesen-Zähler je Typ, Absender-Auflösung über `creators` (Batch-Query nach `user_id`), sowie Mutationen `setMessageStatus` (read / new / deleted) — ausschliesslich UPDATE auf `status`.
- `src/integrations/supabase/types.ts` kennt `messages` nicht; Zugriff daher über lokale Typen in `messages.ts` plus Type-Cast am Client. Keine Regenerierung der Typen.
- Route-Datei `src/routes/_authenticated/messages.index.tsx` mit `validateSearch` (`type`, `id`) nach dem bestehenden Muster von `/campaigns`; UI-Teile als `MessagesList`, `MessageReader` in `src/components/app/`.
- Icons als Assets in `src/assets` (system, moderator) und in Liste wie Lesebereich wiederverwendet.
- Relative Zeitangaben mit `date-fns` (`formatDistanceToNow`, Locale `de`), falls bereits im Projekt vorhanden — sonst kleine eigene Hilfsfunktion ohne neue Dependency.
- Alle Texte als neue Keys unter `messages.*` in `src/locales/de.json`; bestehende `nav.messages*`-Keys werden auf die neuen Labels angepasst.
- Nach der Umsetzung Build/Typecheck.
