import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function UrlInputWithLink({ className, ...inputProps }: React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useTranslation();
  const value = (inputProps.value as string | undefined) || "";
  const canOpen = !!value && /^https?:\/\//i.test(value);

  return (
    <div className="flex items-center gap-2">
      <Input className={cn("flex-1", className)} {...inputProps} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        disabled={!canOpen}
        onClick={() => window.open(value, "_blank", "noopener,noreferrer")}
        aria-label={t("profile.openLink")}
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
}
