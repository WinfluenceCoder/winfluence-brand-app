import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  CalendarClock,
  Wallet,
  Gift,
  Megaphone,
  X,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/winfluence-logo.png";

export const Route = createFileRoute("/campaigns/preview/$id")({
  head: () => ({
    meta: [
      { title: "Kampagne – Winfluence" },
      {
        name: "description",
        content:
          "Kampagnen-Details auf Winfluence: Briefing, Zeitraum, Budget und Anforderungen auf einen Blick.",
      },
      { property: "og:title", content: "Kampagne – Winfluence" },
      {
        property: "og:description",
        content:
          "Kampagnen-Details auf Winfluence: Briefing, Zeitraum, Budget und Anforderungen auf einen Blick.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicCampaignPreview,
});

type CampaignRow = {
  id: number;
  title: string | null;
  status: string | null;
  type: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
  campaign_visual_url: string | null;
  product: string | null;
  goal: string | null;
  targetgroup: string | null;
  key_message: string | null;
  briefing: string | null;
  requirements: string | null;
  post_type: string | null;
  hashtags: string | null;
  link_list: string | null;
  target_url: string | null;
  coupon: string | null;
  budget: number | null;
  start: string | null;
  ende: string | null;
  apply_till: string | null;
  barter_desc: string | null;
  barter_value: number | null;
  barter_order_url: string | null;
  barter_order_coupon: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const dateFmt = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function fmtDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return dateFmt.format(d);
}

const chfFmt = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

function fmtChf(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return chfFmt.format(value);
}

function statusClasses(status: string | null) {
  switch (status) {
    case "published":
    case "approved":
      return "border-transparent bg-blue-100 text-blue-800";
    case "running":
      return "border-transparent bg-emerald-100 text-emerald-800";
    case "expired":
    case "ended":
      return "border-transparent bg-amber-100 text-amber-900";
    default:
      return "border-transparent bg-muted text-muted-foreground";
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="text-base leading-relaxed text-foreground">{children}</div>
    </section>
  );
}

function TextSection({
  title,
  value,
}: {
  title: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <>
      <Separator />
      <Section title={title}>
        <p className="whitespace-pre-line">{value}</p>
      </Section>
    </>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function PublicCampaignPreview() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const campaignId = Number(id);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-campaign", campaignId],
    enabled: Number.isFinite(campaignId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as unknown as CampaignRow | null) ?? null;
    },
  });

  const campaign = data ?? null;

  const hasBarter =
    !!campaign &&
    (campaign.barter_desc ||
      campaign.barter_value !== null ||
      campaign.barter_order_url ||
      campaign.barter_order_coupon);

  const hashtags = (campaign?.hashtags ?? "")
    .split(/[\s,]+/)
    .map((h) => h.trim())
    .filter(Boolean);

  const links = (campaign?.link_list ?? "")
    .split(/[\s,\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background font-roboto">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <img src={logo} alt="Winfluence" className="h-7 w-auto" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.close()}
            className="text-muted-foreground"
          >
            <X className="mr-1.5 h-4 w-4" />
            {t("campaigns.preview.close")}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-3/4" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        ) : isError || !campaign ? (
          <div className="py-24 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold tracking-tight">
              {t("campaigns.preview.notFound")}
            </h1>
          </div>
        ) : (
          <>
            {campaign.campaign_visual_url ? (
              <img
                src={campaign.campaign_visual_url}
                alt={campaign.title ?? ""}
                className="aspect-video w-full rounded-xl object-cover"
              />
            ) : (
              <div className="aspect-video w-full rounded-xl bg-gradient-to-br from-muted to-accent" />
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {campaign.brand_logo_url ? (
                  <img
                    src={campaign.brand_logo_url}
                    alt={campaign.brand_name ?? ""}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : null}
                {campaign.brand_name ? (
                  <span className="text-sm font-medium text-muted-foreground">
                    {campaign.brand_name}
                  </span>
                ) : null}
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {campaign.title ?? "–"}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                {campaign.status ? (
                  <Badge variant="outline" className={statusClasses(campaign.status)}>
                    {t(`campaignsList.status.${campaign.status}`, {
                      defaultValue: campaign.status,
                    })}
                  </Badge>
                ) : null}
                {campaign.type ? (
                  <Badge variant="secondary">{campaign.type}</Badge>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Fact
                icon={CalendarDays}
                label={t("campaigns.preview.period")}
                value={
                  fmtDate(campaign.start) || fmtDate(campaign.ende)
                    ? `${fmtDate(campaign.start) ?? "–"} – ${fmtDate(campaign.ende) ?? "–"}`
                    : null
                }
              />
              <Fact
                icon={CalendarClock}
                label={t("campaigns.preview.applyTill")}
                value={fmtDate(campaign.apply_till)}
              />
              <Fact
                icon={Wallet}
                label={t("campaigns.preview.budget")}
                value={fmtChf(campaign.budget)}
              />
              <Fact
                icon={Gift}
                label={t("campaigns.preview.barterValue")}
                value={fmtChf(campaign.barter_value)}
              />
            </div>

            <TextSection title={t("campaigns.preview.product")} value={campaign.product} />
            <TextSection title={t("campaigns.preview.goal")} value={campaign.goal} />
            <TextSection
              title={t("campaigns.preview.targetgroup")}
              value={campaign.targetgroup}
            />

            {campaign.key_message ? (
              <>
                <Separator />
                <Section title={t("campaigns.preview.keyMessage")}>
                  <blockquote className="border-l-4 border-primary bg-muted/50 px-4 py-3 text-lg font-medium italic">
                    {campaign.key_message}
                  </blockquote>
                </Section>
              </>
            ) : null}

            <TextSection title={t("campaigns.preview.briefing")} value={campaign.briefing} />
            <TextSection
              title={t("campaigns.preview.requirements")}
              value={campaign.requirements}
            />
            <TextSection
              title={t("campaigns.preview.postType")}
              value={campaign.post_type}
            />

            {hashtags.length > 0 ? (
              <>
                <Separator />
                <Section title={t("campaigns.preview.hashtags")}>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((h) => (
                      <span
                        key={h}
                        className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                      >
                        {h.startsWith("#") ? h : `#${h}`}
                      </span>
                    ))}
                  </div>
                </Section>
              </>
            ) : null}

            {links.length > 0 || campaign.target_url ? (
              <>
                <Separator />
                <Section title={t("campaigns.preview.links")}>
                  <ul className="space-y-1">
                    {campaign.target_url ? (
                      <li>
                        <a
                          href={campaign.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline underline-offset-4"
                        >
                          {campaign.target_url}
                        </a>
                      </li>
                    ) : null}
                    {links.map((l) => (
                      <li key={l}>
                        {/^https?:\/\//i.test(l) ? (
                          <a
                            href={l}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary underline underline-offset-4"
                          >
                            {l}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">{l}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              </>
            ) : null}

            {campaign.coupon ? (
              <>
                <Separator />
                <Section title={t("campaigns.preview.coupon")}>
                  <code className="inline-block rounded-md border border-dashed border-border bg-muted px-3 py-2 font-mono text-sm">
                    {campaign.coupon}
                  </code>
                </Section>
              </>
            ) : null}

            {hasBarter ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t("campaigns.preview.barter")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {campaign.barter_desc ? (
                    <p className="whitespace-pre-line">{campaign.barter_desc}</p>
                  ) : null}
                  {campaign.barter_value !== null ? (
                    <p>
                      <span className="text-muted-foreground">
                        {t("campaigns.preview.barterValue")}:{" "}
                      </span>
                      {fmtChf(campaign.barter_value)}
                    </p>
                  ) : null}
                  {campaign.barter_order_url ? (
                    <p>
                      <span className="text-muted-foreground">
                        {t("campaigns.preview.barterOrderUrl")}:{" "}
                      </span>
                      <a
                        href={campaign.barter_order_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-4"
                      >
                        {campaign.barter_order_url}
                      </a>
                    </p>
                  ) : null}
                  {campaign.barter_order_coupon ? (
                    <p>
                      <span className="text-muted-foreground">
                        {t("campaigns.preview.barterOrderCoupon")}:{" "}
                      </span>
                      <code className="font-mono">{campaign.barter_order_coupon}</code>
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {campaign.created_at || campaign.updated_at ? (
              <p className="pt-4 text-xs text-muted-foreground">
                {campaign.created_at
                  ? `${t("campaigns.preview.createdAt")} ${fmtDate(campaign.created_at)}`
                  : ""}
                {campaign.created_at && campaign.updated_at ? " · " : ""}
                {campaign.updated_at
                  ? `${t("campaigns.preview.updatedAt")} ${fmtDate(campaign.updated_at)}`
                  : ""}
              </p>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
