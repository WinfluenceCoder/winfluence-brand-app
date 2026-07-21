import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploading: boolean;
  onCropped: (blob: Blob) => Promise<void> | void;
  maxOutput: number;
  aspect?: number;
  title?: string;
}

async function getCroppedWebp(
  imageSrc: string,
  area: Area,
  maxOutput: number,
  aspect: number,
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });
  const outW = Math.min(area.width, maxOutput);
  const outH = Math.round(outW / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/webp",
      0.9,
    );
  });
}

export function PhotoCropDialog({
  open,
  onOpenChange,
  uploading,
  onCropped,
  maxOutput,
  aspect = 1,
  title,
}: Props) {
  const { t } = useTranslation();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setDragActive(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [imageUrl]);

  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast.error(t("photoCrop.invalidType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("photoCrop.tooLarge"));
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const onSave = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedWebp(imageUrl, croppedAreaPixels, maxOutput, aspect);
      await onCropped(blob);
    } catch (err) {
      console.error(err);
      toast.error(t("photoCrop.uploadError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? t("photoCrop.title")}</DialogTitle>
        </DialogHeader>

        {!imageUrl ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/60"
            }`}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{t("photoCrop.dropzone")}</p>
            <p className="text-xs text-muted-foreground">{t("photoCrop.formats")}</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div
              className="relative w-full bg-muted rounded-lg overflow-hidden"
              style={{ aspectRatio: String(aspect) }}
            >
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                minZoom={1}
                maxZoom={3}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, area) => setCroppedAreaPixels(area)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-12">
                {t("photoCrop.zoom")}
              </span>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.01}
                onValueChange={(v) => setZoom(v[0] ?? 1)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            {t("photoCrop.cancel")}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!imageUrl || !croppedAreaPixels || uploading}
          >
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("photoCrop.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
