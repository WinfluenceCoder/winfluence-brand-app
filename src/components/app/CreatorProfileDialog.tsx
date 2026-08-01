import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Instagram, Linkedin, User, Youtube } from "lucide-react";
import { TikTokIcon } from "@/components/app/CreatorsTable";
import type { CurationCreator } from "@/lib/campaign-curation";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value && value.trim() !== "" ? value : "–"}</div>
    </div>
  );
}

function SocialLink({
  url,
  Icon,
  label,
}: {
  url: string | null;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

export function CreatorProfileDialog({
  creator,
  open,
  onOpenChange,
}: {
  creator: CurationCreator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const fullName = creator
    ? [creator.first_name, creator.last_name].filter(Boolean).join(" ")
    : "";
  const address = creator
    ? [
        [creator.address_street, creator.address_nr].filter(Boolean).join(" "),
        [creator.address_zip, creator.address_city].filter(Boolean).join(" "),
      ]
        .filter((s) => s !== "")
        .join(", ")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("creatorsList.detail.contact")}</DialogTitle>
        </DialogHeader>
        {creator ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {creator.foto_url ? (
                  <AvatarImage src={creator.foto_url} alt="" />
                ) : null}
                <AvatarFallback>
                  <User className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold tracking-tight">
                  {creator.nick_name || fullName || "–"}
                </div>
                {creator.status ? (
                  <Badge variant="secondary" className="mt-1">
                    {creator.status}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("creatorsList.detail.name")} value={fullName} />
              <Field
                label={t("creatorsList.columns.nickname")}
                value={creator.nick_name}
              />
              <Field
                label={t("creatorsList.columns.email")}
                value={creator.e_mail_address}
              />
              <Field
                label={t("creatorsList.columns.mobile")}
                value={creator.mobile}
              />
              <Field label={t("creatorsList.detail.address")} value={address} />
              <Field
                label={t("creatorsList.detail.company")}
                value={creator.company_legal_name}
              />
            </div>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">
                {t("creatorsList.detail.socials")}
              </div>
              <div className="flex flex-wrap gap-4">
                <SocialLink url={creator.insta_url} Icon={Instagram} label="Instagram" />
                <SocialLink url={creator.tiktok_url} Icon={TikTokIcon} label="TikTok" />
                <SocialLink url={creator.youtube_url} Icon={Youtube} label="YouTube" />
                <SocialLink url={creator.linkedin_url} Icon={Linkedin} label="LinkedIn" />
                {!creator.insta_url &&
                !creator.tiktok_url &&
                !creator.youtube_url &&
                !creator.linkedin_url ? (
                  <span className="text-sm text-muted-foreground">
                    {t("creatorsList.detail.noSocials")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
