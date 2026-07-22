## Ziel
Auf `/profile` die Profil-Vollständigkeit anzeigen und pro Abschnitt visuell markieren, ob alle Felder ausgefüllt sind.

## Änderungen in `src/routes/_authenticated/profile.tsx`

### 1) Fortschrittsbalken zwischen „Mein Profil" und „Status"
Neuen Block direkt nach `<h1>` und vor dem Status-Badge einfügen:
- Label „Vollständigkeit"
- `<Progress>` (bereits im Projekt) mit `value = clamp(brand?.profile_quality ?? 1, 1, 100)`, `flex-1`
- Prozent-Text (`{v} %`), tabular-nums
- Layout: `flex items-center gap-4 w-full mt-4`
- Wert wird live aus `form.watch()` + `logoUrl`/`photoUrl` neu berechnet, damit sich der Balken beim Ausfüllen aktualisiert (Formel wie in `computeProfileQuality`: nicht-leere Felder / Gesamtzahl aller getrackten Felder × 100, gerundet, clamp 1..100). Als Nenner wird die Anzahl der im Formular getrackten Felder verwendet (stabile Client-Näherung); nach dem Speichern zeigt das Dashboard weiterhin den serverseitig berechneten Wert.

### 2) Grünes Check-Icon pro Abschnitts-Titel
Pro Abschnitt eine „complete"-Bedingung (alle Pflicht- + Profilfelder des Abschnitts nicht leer). `<h2>` wird zu Flex-Container; wenn `complete === true`, wird rechts neben dem Titel ein grünes `<CheckCircle2 />` (lucide-react, `text-green-600`, `h-5 w-5`) gerendert.

Abschnitts-Definitionen:
- **Meine Firma** (`companySection`): `logoUrl`, `legal_name` (readonly, aus brand), `mwst_nr` (readonly), `domain`, `insta_url`, `billing_address_to`, `billing_address_street`, `billing_address_nr`, `billing_address_zip`, `billing_address_city`.
- **Meine Brand** (`brandSection`): `brand_name`, `brand_pitch`, `hashtags`, `linkedin_url`, `youtube_url`, `tiktok_url`.
- **Ansprechperson** (`contactSection`): `first_name`, `last_name`, `job_title`, `user_linkedin_url`, `gender`, `mobile`, `photoUrl`.

Die Werte kommen live aus `form.watch()` bzw. den lokalen States `logoUrl`/`photoUrl` sowie den readonly-Brand-Feldern. „Ausgefüllt" = nicht `null`/`undefined` und nach `trim()` nicht leer.

### 3) i18n
Neuer Key `profile.completeness` = „Vollständigkeit" in `src/locales/de.json`.

## Technische Notizen
- Keine Backend-Änderungen, keine Schema-Änderungen.
- `Progress` und `CheckCircle2` sind bereits verfügbar (`@/components/ui/progress`, `lucide-react`).
- Reine Präsentations-/Frontend-Änderung.
