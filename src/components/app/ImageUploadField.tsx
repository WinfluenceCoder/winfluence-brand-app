import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  bucket: string;
  value: string | null;
  onChange: (url: string | null) => void;
  prefix?: string;
  hintKey: string;
  error?: string | null;
};

export function ImageUploadField({ bucket, value, onChange, prefix = "img", hintKey, error }: Props) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("no-user");
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${uid}/${prefix}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(pub.publicUrl);
    } catch (err) {
      console.error(err);
      toast.error(t("campaignForm.uploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
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
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? t("common.loading") : t("campaignForm.uploadButton")}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
          <p className="mt-2 text-xs text-muted-foreground">{t(hintKey)}</p>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
