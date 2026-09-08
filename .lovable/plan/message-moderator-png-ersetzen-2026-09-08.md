# message-moderator.png ersetzen

## Ziel
Das Moderator-Avatar-Bild in der Nachrichten-Anbox durch das neu hochgeladene Bild ersetzen.

## Änderung
- `user-uploads://favicon_website.png` (831×831, rotes Kreis-Logo auf schwarzem Grund) kopieren nach `src/assets/message-moderator.png` (gleicher Dateiname — alle bestehenden Imports in `src/components/app/MessageAvatar.tsx` bleiben intakt).
- Keine Code-Änderung nötig: Das Bild wird bereits als quadratischer, kreisförmig beschnittener Avatar (`h-9 w-9 rounded-full object-cover`) gerendert, das Seitenverhältnis stimmt.

## Nicht angefasst
- Keine Code-, Layout- oder Backend-Änderungen — nur die Bilddatei wird überschrieben.
