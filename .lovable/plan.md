# CreatorProfile: Layout neu anordnen

Ziel auf `/influencers/$id`: Die Plattform-Tabs oberhalb des plattform­spezifischen Headers (Thumbnail/Username/etc.) platzieren, weil diese Elemente aus den Plattform-Stats kommen. Neuer Identitäts-Block ganz oben mit Creator-Basisdaten.

## Neue Reihenfolge (Top → Bottom)

```text
[1] Identitäts-Block (Creator-Basisdaten, NICHT plattform­spezifisch)
      H1  nick_name
      Thumbnail  foto_url            (unter H1)
      first_name + last_name         (unter Thumbnail)
        └ rechts daneben: Platzhalter "Platzhalter Claim"
      Platzhalter Biographie          (darunter)
      Social-Icon-Links              (insta/tiktok/youtube_url — bleiben hier)

[2] Tab-Control (Instagram / TikTok / YouTube)

[3] Card: plattform­spezifischer Header  (nur im aktiven Tab, Status ok)
      Thumbnail  profile_pic_url
      Username  display_name || handle
      Ort  city, country
      Sprache  language
      type_score-Badge

[4] PlatformStats (Stand/Refresh, KPIs, Bio, Kategorien, Mentions, Content)
[5] AudienceSection (nur Instagram)
```

## Dateien

### `src/components/app/creator-profile/CreatorProfile.tsx`
- Header durch neuen Identitäts-Block ersetzen (nur `creator.*`):
  - `<h1>` mit `creator.nick_name` (Fallback Anzeigenamen wie bisher).
  - `<Avatar>` mit `creator.foto_url` (Fallback User-Icon).
  - Zeile `first_name + last_name` mit Platzhalter "Platzhalter Claim" rechts (`justify-between`).
  - Platzhalter-Biographie als statischer Textblock.
  - Social-Icon-Links bleiben hier (Creator-Basisdaten).
- Plattform-spezifische Elemente (Avatar aus `profile_pic_url`, `display_name`/`handle`, Ort, Sprache, `type_score`) aus dem Header entfernen — sie wandern in `PlatformTab`.
- Tabs bleiben, TabsContent rendert unverändert `<PlatformTab>`.

### `src/components/app/creator-profile/PlatformTab.tsx`
- Im `ok`-Zweig vor `<PlatformStats>` eine neue Card einfügen (neue kleine Komponente `PlatformHeader` inline oder in `primitives.tsx`):
  - Avatar `stats.profile_pic_url`.
  - Username `stats.display_name ?? stats.handle ?? "–"`.
  - Ort `[city, country]`, Sprache `language`.
  - `type_score`-Badge rechts.
- Leere/`null`-Werte ausblenden ("–"-Fallback).

### `src/locales/de.json`
- Neue i18n-Keys im Zweig `creatorProfile`:
  - `claimPlaceholder` = "Platzhalter Claim"
  - `bioPlaceholder` = "Platzhalter für die Biographie"

## Nicht berührt
- `PlatformStats.tsx` (Stand/Refresh + KPIs/Content bleiben), `AudienceSection.tsx`, Datenlayer `creator-stats.ts`, Route.
- Keine DB-Änderungen, keine Edge Function.

## Defensive Regeln
Alle Felder optional, leere Sektionen ausblenden, Avatar-Fallback, keine plattform­spezifischen Daten im oberen Identitäts-Block.

## Abschluss
Typecheck (`tsgo`) nach der Implementierung.
