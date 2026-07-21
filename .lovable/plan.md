# Photo-Crop-Dialog für Uploads

Einheitlicher Crop-/Zuschneide-Dialog vor jedem Bild-Upload, adaptiert aus dem hochgeladenen Referenzcode. Statt Bild direkt hochzuladen, öffnet sich ein Dialog mit Drag&Drop-Dropzone, Cropper + Zoom-Slider. Output ist immer ein quadratisches (bzw. bei Campaign Visual quadratisches) WebP mit fester Max-Kantenlänge.

## Einsatzorte & Zielgrößen

- `/profile`: Brand Logo → **512×512**, Profilbild → **512×512**
- `/campaigns/new` + `/campaigns/:id/edit`:
  - Brand Logo → **512×512**
  - Campaign Visual → **1024×1024**

## Neue/Geänderte Dateien

1. **`src/components/app/PhotoCropDialog.tsx`** (neu)
   - Basiert auf hochgeladenem `photo-crop-dialog.tsx`.
   - Props erweitert: `maxOutput: number` (512 oder 1024), `aspect?: number` (default 1), `title?: string`.
   - Nutzt `react-easy-crop` + shadcn `Dialog`/`Slider`/`Button`.
   - Validierung: nur `image/jpeg|png|webp`, max 5 MB.
   - Output: WebP-Blob via Canvas, `min(area.width, maxOutput)`.
   - i18n-Keys unter `photoCrop.*` (global, nicht `profile.photoCrop.*`), damit er auch im Campaign-Kontext passt.

2. **`src/components/app/ImageUploadField.tsx`** (ändern)
   - Neues Prop `maxOutput: number` (Pflicht) und optional `aspect`.
   - Statt direkter `<input type="file">`-Auswahl öffnet der Button den `PhotoCropDialog`.
   - Nach `onCropped(blob)`: Upload des Blobs (contentType `image/webp`, Dateiname `${prefix}-${Date.now()}.webp`) in denselben Bucket wie heute; Public-URL zurück an `onChange`.
   - `uploading`-Status bleibt sichtbar (im Dialog-Save-Button + außen).

3. **`src/components/app/CampaignForm.tsx`** (ändern)
   - `ImageUploadField` für `brand_logo_url`: `maxOutput={512}`.
   - `ImageUploadField` für `campaign_visual_url`: `maxOutput={1024}`.

4. **`src/routes/_authenticated/profile.tsx`** (ändern)
   - Bestehende `onLogoChange`/`onPhotoChange` + versteckte File-Inputs entfernen.
   - Buttons „Logo hochladen" / „Foto hochladen" öffnen jeweils den `PhotoCropDialog`.
   - Upload-Logik (Bucket `brand-logos` bzw. `user_fotos`, Pfad `${uid}/logo-...webp` bzw. `${uid}/photo-...webp`) in den `onCropped`-Handler verschieben.
   - `logo_url` / `user_foto_url`-States wie gehabt setzen und beim Speichern mitschicken.

5. **`src/locales/de.json`** (ändern)
   - Neuer Block `photoCrop`: `title`, `dropzone`, `formats`, `zoom`, `save`, `cancel`, `invalidType`, `tooLarge`, `uploadError`.
   - `campaignForm.hints.brand_logo_url` / `campaign_visual_url` ggf. auf neue Zielgrößen anpassen.

## Abhängigkeit

- `bun add react-easy-crop` (shadcn `Slider` ist bereits vorhanden — sonst nachziehen).

## Nicht im Scope

- Keine Änderungen an Supabase-Buckets/Policies (WebP-Uploads sind bereits erlaubt).
- Kein Backend-/Cloud-Feature; nur Frontend.
- Keine anderen Formularlogiken angetastet.
