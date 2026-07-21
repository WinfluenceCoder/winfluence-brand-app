import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhotoCropDialog } from "@/components/app/PhotoCropDialog";

type Props = {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  prefix?: string;
  hintKey: string;
  error?: string | null;
  maxOutput: number;
  aspect?: number;
};

export function ImageUploadField({
  bucket,
  value,
  onChange,
  prefix = "img",
  hintKey,
  error,
  maxOutput,
  aspect = 1,
}: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCropped = async (blob: Blob) => {
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no-user");
      const path = `${uid}/${prefix}-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, blob, {
        upsert: true,
        contentType: "image/webp",
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(pub.publicUrl);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(t("campaignForm.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-4 rounded-md border p-3", error && "border-destructive")}>
        {value ? (
          <img src={value} alt="" className="h-20 w-20 rounded object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded bg-muted text-muted-foreground">
            <Upload className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={uploading}
          >
            {uploading ? t("common.loading") : t("campaignForm.uploadButton")}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">{t(hintKey)}</p>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <PhotoCropDialog
        open={open}
        onOpenChange={setOpen}
        uploading={uploading}
        onCropped={handleCropped}
        maxOutput={maxOutput}
        aspect={aspect}
      />
    </div>
  );
}
