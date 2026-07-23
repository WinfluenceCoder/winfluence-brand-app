import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Megaphone } from "lucide-react";
import { CampaignsTable } from "@/components/app/CampaignsTable";
import { campaignsListQueryOptions } from "@/lib/campaigns-list";

const DASHBOARD_STATUSES = [
  "draft",
  "published",
  "running",
  "expired",
  "ended",
] as const;

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function useMyCampaigns() {
  return useSuspenseQuery(campaignsListQueryOptions({ statusIn: DASHBOARD_STATUSES }));
}

function useProfileQuality() {
  return useSuspenseQuery({
    queryKey: ["home", "profileQuality"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("profile_quality")
        .maybeSingle<{ profile_quality: number | null }>();
      if (error) throw new Error(error.message);
      return data?.profile_quality ?? 1;
    },
  });
}

function ProfileProgress() {
  const { t } = useTranslation();
  const { data: quality } = useProfileQuality();
  const v = Math.min(100, Math.max(1, quality ?? 1));
  if (v >= 100) return null;
  return (
    <div className="mt-4 space-y-3">
      {v < 80 ? (
        <p className="text-sm text-muted-foreground">{t("home.welcome")}</p>
      ) : null}
      <div className="flex w-full items-center gap-4">
        <span className="text-sm font-medium whitespace-nowrap">
          {t("home.profileLabel")}
        </span>
        <Progress value={v} className="flex-1" />
        <span className="text-sm tabular-nums w-12 text-right">{v} %</span>
        <Button asChild size="sm" variant="outline">
          <Link to="/profile">{t("home.completeProfile")}</Link>
        </Button>
      </div>
    </div>
  );
}

function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useMyCampaigns();

  if (!data || data.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("home.title")}</h1>
        <ProfileProgress />
        <button
          type="button"
          onClick={() => router.navigate({ to: "/campaigns/new" })}
          className="mt-6 flex w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-16 text-center transition-colors hover:border-primary hover:bg-accent"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <Megaphone className="h-7 w-7" />
            </div>
            <div className="text-lg font-semibold">{t("home.emptyTitle")}</div>
            <p className="text-sm text-muted-foreground max-w-md">{t("home.emptySub")}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> {t("home.newCampaign")}
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("home.title")}</h1>
      <ProfileProgress />

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>{t("home.campaignsTitle")}</CardTitle>
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="h-4 w-4 mr-1" /> {t("home.newCampaign")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <CampaignsTable rows={data} />
        </CardContent>
      </Card>
    </div>
  );
}
