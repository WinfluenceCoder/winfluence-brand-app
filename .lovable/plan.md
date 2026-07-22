## Banner-Upload im Profil ("Meine Firma")

Neues optionales Banner-Feld direkt unterhalb des Logo-Feldes, analog zum Logo-Flow, mit 1024×1024-Crop, Upload in den bestehenden Bucket `brand-banners` und Persistenz in `brands.banner_url`. Keine Schema-Änderungen, kein Cloud-Aktivieren.

### 1. `src/lib/brands.functions.ts`
- Zod-Schema `updateSchema` um `banner_url: z.string().trim().max(1000).optional().nullable()` erweitern.
- Feld im `patch`-Update mit übergeben (fällt bereits über `...rest` durch, sobald es im Schema steht).

### 2. `src/routes/_authenticated/profile.tsx`
- Neuer State `bannerUrl` (initial `brand?.banner_url ?? null`), `uploadingBanner`, `bannerDialogOpen`.
- Handler `onBannerCropped(blob)`: Upload nach `brand-banners/{uid}/banner-{ts}.webp` (upsert, content-type `image/webp`), Public URL setzen, Dialog schließen. Fehlerbehandlung analog zu Logo.
- Handler `onBannerRemove()`: aus URL den Pfad ableiten (Segment nach `/brand-banners/`), `supabase.storage.from("brand-banners").remove([path])` aufrufen (Fehler nur loggen), `bannerUrl` auf `null` setzen.
- UI direkt unter dem Logo-Block: gleiche Struktur wie Logo (Vorschau-Kachel im 16:9- oder Banner-typischen Rahmen, Upload-Link "Banner hochladen", Hint-Text). Zusätzlich sichtbarer "Entfernen"-Link, wenn `bannerUrl` gesetzt.
- `PhotoCropDialog` mit `aspect={1}`, `maxOutput={1024}`, `open={bannerDialogOpen}`, `onCropped={onBannerCropped}`.
- Kein Pflichtfeld: keine Validierungsfehler, kein `setBannerError`.
- `companyFields`-Array um `bannerUrl` erweitern, sodass Sektion "Meine Firma" nur bei gesetztem Banner als vollständig gilt und in `completeness` einfließt.
- Im `onSubmitWrapped` das Feld `banner_url: bannerUrl` an `saveBrand({ data: ... })` mitgeben.
- Falls die generierten Supabase-Typen `banner_url` noch nicht kennen, gleicher Cast-Ansatz wie bei `industry` (`as { banner_url?: string | null } | null` beim Lesen).

### 3. `src/locales/de.json`
- Neue Keys unter `profile`:
  - `banner`: "Banner"
  - `uploadBanner`: "Banner hochladen"
  - `bannerHint`: Hinweis-Text (Empfehlung 1024×1024, optional).
  - `removeBanner`: "Banner entfernen"

### Nicht Teil des Changes
- Keine SQL-Migration, kein Bucket-Anlegen, keine RLS-Policy-Änderungen (bereits vorhanden).
- Keine Änderungen an anderen Formularen oder am Dashboard.
