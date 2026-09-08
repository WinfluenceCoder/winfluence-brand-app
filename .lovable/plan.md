# message-system.png ersetzen

## Ziel
Das System-Nachrichten-Avatar-Bild durch das neu hochgeladene Bild ersetzen.

## Änderung
- `user-uploads://favicon_moderator.png` (761×761, graues Kreis-Logo mit roten Punkten auf schwarzem Grund) kopieren nach `src/assets/message-system.png` (gleicher Dateiname — bestehender Import in `src/components/app/MessageAvatar.tsx` bleibt intakt).
- Keine Code-Änderung nötig: Das Bild wird bereits als quadratischer, kreisförmig beschnittener Avatar (`h-9 w-9 rounded-full object-cover`) gerendert, das Seitenverhältnis stimmt.

## Nicht angefasst
- Keine Code-, Layout- oder Backend-Änderungen — nur die Bilddatei wird überschrieben.
