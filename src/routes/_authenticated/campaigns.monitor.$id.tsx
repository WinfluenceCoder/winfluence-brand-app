import { useState, type ReactNode } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";

import { getMyCampaign } from "@/lib/campaigns.functions";
import { CampaignCard } from "@/components/app/CampaignCard";
import { CreatorProfileDialog } from "@/components/app/CreatorProfileDialog";
import { MonitoringCreatorCard } from "@/components/app/MonitoringCreatorCard";
import { MonitoringPerformanceCard } from "@/components/app/MonitoringPerformanceCard";
import {
  monitoringQueryOptions,
  type MonitoringCollab,
} from "@/lib/campaign-monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/campaigns/monitor/$id")({
  component: MonitorCampaignPage,
});

function Column({
  title,
  emptyText,
  items,
  onOpen,
}: {
  title: string;
  emptyText: string;
  items: MonitoringCollab[];
  onOpen: (c: MonitoringCollab) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((c) => (
            <MonitoringCreatorCard key={c.id} collab={c} onOpen={onOpen} />
          ))}
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function InfoCard({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

const dateFmt = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function MonitorCampaignPage() {
  const { id } = Route.useParams();
  const campaignId = Number(id);
  const router = useRouter();
  const { t } = useTranslation();
  const fetchCampaign = useServerFn(getMyCampaign);
  const [profile, setProfile] = useState<MonitoringCollab | null>(null);

  const { data } = useSuspenseQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => fetchCampaign({ data: { id: campaignId } }),
  });

  // `title` existiert in der DB, fehlt aber in den generierten Typen.
  const campaign = data as unknown as {
    title: string | null;
    briefing: string | null;
    campaign_visual_url: string | null;
    ende: string | null;
    status: string | null;
  } | null;

  const monitoring = useQuery(monitoringQueryOptions(campaignId));

  const isRunning = campaign?.status === "running";

  let deadlineHint: string | null = null;
  if (campaign?.ende) {
    const end = new Date(campaign.ende);
    if (!Number.isNaN(end.getTime())) {
      const diffDays = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
      deadlineHint =
        diffDays >= 0
          ? t("campaigns.monitor.daysRemaining", { count: diffDays })
          : t("campaigns.monitor.endedOn", { date: dateFmt.format(end) });
    }
  }

  const rows = monitoring.data ?? [];
  const hired = rows.filter((c) => c.status === "hired" || c.status === "working");
  const delivered = rows.filter((c) => c.status === "delivered");

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("campaigns.monitor.title")}
        </h1>
        {deadlineHint ? (
          <span className="text-sm text-muted-foreground">{deadlineHint}</span>
        ) : null}
      </div>

      {campaign ? (
        <CampaignCard
          campaign={{
            title: campaign.title ?? null,
            briefing: campaign.briefing,
            campaign_visual_url: campaign.campaign_visual_url,
          }}
          id={campaignId}
          status={campaign.status ?? null}
        />
      ) : null}

      {!isRunning ? (
        <InfoCard>{t("campaigns.monitor.notRunning")}</InfoCard>
      ) : (
        <>
          <MonitoringPerformanceCard />

          {monitoring.isLoading ? (
            <InfoCard>{t("campaigns.monitor.loading")}</InfoCard>
          ) : monitoring.isError ? (
            <Card>
              <CardContent className="space-y-3 py-8 text-center">
                <p className="text-sm font-medium">
                  {t("campaigns.monitor.errorTitle")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {monitoring.error instanceof Error ? monitoring.error.message : ""}
                </p>
                <Button variant="outline" onClick={() => void monitoring.refetch()}>
                  {t("campaigns.monitor.retry")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <Column
                title={t("campaigns.monitor.hiredTitle")}
                emptyText={t("campaigns.monitor.hiredEmpty")}
                items={hired}
                onOpen={setProfile}
              />
              <Column
                title={t("campaigns.monitor.deliveredTitle")}
                emptyText={t("campaigns.monitor.deliveredEmpty")}
                items={delivered}
                onOpen={setProfile}
              />
            </div>
          )}

          <div className="flex justify-start pt-4">
            <Button size="lg">{t("campaigns.monitor.endCampaign")}</Button>
          </div>
        </>
      )}

      <CreatorProfileDialog
        creator={profile?.creator ?? null}
        open={profile != null}
        onOpenChange={(open) => {
          if (!open) setProfile(null);
        }}
      />
    </div>
  );
}
