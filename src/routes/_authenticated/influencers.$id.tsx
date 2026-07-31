import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Instagram, Linkedin, User, Youtube } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TikTokIcon } from "@/components/app/CreatorsTable";
import { creatorDetailQueryOptions } from "@/lib/creators-list";

export const Route = createFileRoute("/_authenticated/influencers/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      creatorDetailQueryOptions(Number(params.id)),
    ),
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  component: CreatorDetailPage,
});

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
      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-4"
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  );
}

function CreatorDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();
  const { data: creator } = useSuspenseQuery(
    creatorDetailQueryOptions(Number(id)),
  );

  if (!creator) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        {t("creatorsList.notFound")}
      </div>
    );
  }

  const fullName = [creator.first_name, creator.last_name]
    .filter(Boolean)
    .join(" ");
  const address = [
    [creator.address_street, creator.address_nr].filter(Boolean).join(" "),
    [creator.address_zip, creator.address_city].filter(Boolean).join(" "),
  ]
    .filter((s) => s !== "")
    .join(", ");

  return (
    <div className="p-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {creator.foto_url ? <AvatarImage src={creator.foto_url} alt="" /> : null}
          <AvatarFallback>
            <User className="h-6 w-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {creator.nick_name || fullName || "–"}
          </h1>
          {creator.status ? (
            <Badge variant="secondary" className="mt-1">
              {creator.status}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("creatorsList.detail.contact")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label={t("creatorsList.detail.name")} value={fullName} />
            <Field
              label={t("creatorsList.columns.nickname")}
              value={creator.nick_name}
            />
            <Field
              label={t("creatorsList.columns.email")}
              value={creator.e_mail_address}
            />
            <Field label={t("creatorsList.columns.mobile")} value={creator.mobile} />
            <Field label={t("creatorsList.detail.address")} value={address} />
            <Field
              label={t("creatorsList.detail.company")}
              value={creator.company_legal_name}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("creatorsList.detail.socials")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
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
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.history.back()}>
          {t("common.back")}
        </Button>
      </div>
    </div>
  );
}
