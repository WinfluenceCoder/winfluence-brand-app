import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChf, formatNumberCh } from "@/lib/campaign-curation";
import type { MonitoringCollab } from "@/lib/campaign-monitoring";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

function sum(delivered: MonitoringCollab[], pick: (c: MonitoringCollab) => number | null): number {
  return delivered.reduce((acc, c) => acc + (pick(c) ?? 0), 0);
}

export function MonitoringPerformanceCard({
  delivered,
  barterCount,
  barterValue,
}: {
  /** delivered + approved – Basis aller Kennzahlen ausser Barter. */
  delivered: MonitoringCollab[];
  /** delivered + approved + rejected – das Barter-Produkt wurde immer versandt. */
  barterCount: number;
  barterValue: number | null;
}) {
  const { t } = useTranslation();

  const metrics = useMemo(() => {
    const reach = sum(delivered, (c) => c.content?.reach ?? null);
    const likes = sum(delivered, (c) => c.content?.likes ?? null);
    const comments = sum(delivered, (c) => c.content?.comments ?? null);
    const shares = sum(delivered, (c) => c.content?.shares ?? null);
    const engagements = likes + comments + shares;

    const effectiveEngagementRate = reach > 0 ? (engagements / reach) * 100 : null;
    const cash = delivered.reduce((s, c) => s + (c.price ?? 0), 0);
    const barter = barterCount * (barterValue ?? 0);
    const eCpm = reach > 0 ? (cash / reach) * 1000 : null;
    const eCpe = engagements > 0 ? cash / engagements : null;

    return {
      reach,
      likes,
      comments,
      shares,
      effectiveEngagementRate,
      cash,
      barter,
      eCpm,
      eCpe,
    };
  }, [delivered, barterCount, barterValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("campaigns.monitor.performance.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-x-10 gap-y-1 md:grid-cols-2">
        <div>
          <Metric
            label={t("campaigns.monitor.performance.reach")}
            value={formatNumberCh(metrics.reach)}
          />
          <Metric
            label={t("campaigns.monitor.performance.likes")}
            value={formatNumberCh(metrics.likes)}
          />
          <Metric
            label={t("campaigns.monitor.performance.comments")}
            value={formatNumberCh(metrics.comments)}
          />
          <Metric
            label={t("campaigns.monitor.performance.shares")}
            value={formatNumberCh(metrics.shares)}
          />
          <Metric
            label={t("campaigns.monitor.performance.effectiveEngagementRate")}
            value={
              metrics.effectiveEngagementRate != null
                ? `${metrics.effectiveEngagementRate.toFixed(1)}%`
                : "–"
            }
          />
        </div>
        <div>
          <Metric
            label={t("campaigns.monitor.performance.costCash")}
            value={formatChf(metrics.cash)}
          />
          <Metric
            label={t("campaigns.monitor.performance.costBarter")}
            value={formatChf(metrics.barter)}
          />
          <Metric
            label={t("campaigns.monitor.performance.eCpm")}
            value={metrics.eCpm != null ? formatChf(metrics.eCpm) : "–"}
          />
          <Metric
            label={t("campaigns.monitor.performance.eCpe")}
            value={metrics.eCpe != null ? formatChf(metrics.eCpe) : "–"}
          />
          <Metric
            label={t("campaigns.monitor.performance.goalAchievement")}
            value="--"
          />
        </div>
      </CardContent>
    </Card>
  );
}
