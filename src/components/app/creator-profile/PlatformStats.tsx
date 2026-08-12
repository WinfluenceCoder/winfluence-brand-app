import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  asPercent,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeDate,
} from "@/lib/format";
import type {
  ContentEntry,
  CreatorSocialStats,
  MentionEntry,
  Platform,
} from "@/lib/creator-stats";
import {
  BarList,
  FallbackImage,
  KeyValueList,
  KpiCard,
  Section,
} from "./primitives";

type ContentItem = ContentEntry & { kind: "post" | "reel" };

function mentionTotal(m: MentionEntry): number {
  return (m.postcount ?? 0) + (m.reelcount ?? 0) + (m.storycount ?? 0);
}

export function PlatformStats({
  stats,
  platform,
  onRefresh,
  refreshing,
}: {
  stats: CreatorSocialStats;
  platform: Platform;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { t } = useTranslation();
  const [allMentions, setAllMentions] = useState(false);

  const categories = useMemo(
    () =>
      (Array.isArray(stats.categories) ? stats.categories : [])
        .filter((c) => c && c.category)
        .map((c) => ({
          label: String(c.category),
          value: asPercent(c.ratio ?? null) ?? 0,
        }))
        .sort((a, b) => b.value - a.value),
    [stats.categories],
  );

  const mentions = useMemo(() => {
    const raw = stats.raw_json?.mentions;
    if (!Array.isArray(raw)) return [];
    return [...raw].sort((a, b) => mentionTotal(b) - mentionTotal(a));
  }, [stats.raw_json]);

  const content = useMemo<ContentItem[]>(() => {
    const posts = Array.isArray(stats.raw_json?.postArray)
      ? stats.raw_json!.postArray!.map((p) => ({ ...p, kind: "post" as const }))
      : [];
    const reels = Array.isArray(stats.raw_json?.reelArray)
      ? stats.raw_json!.reelArray!.map((r) => ({ ...r, kind: "reel" as const }))
      : [];
    return [...posts, ...reels].sort((a, b) => {
      const ta = a.uploaded ? new Date(a.uploaded).getTime() : 0;
      const tb = b.uploaded ? new Date(b.uploaded).getTime() : 0;
      return tb - ta;
    });
  }, [stats.raw_json]);

  const details = useMemo(() => {
    const raw = stats.raw_json;
    if (!raw) return [];
    const entries: { label: string; value: string }[] = [];
    const yesNo = (v: boolean) => (v ? t("common.yes") : t("common.no"));
    if (raw.isPrivate != null)
      entries.push({
        label: t("creatorProfile.details.isPrivate"),
        value: yesNo(raw.isPrivate),
      });
    if (raw.isBrandAccount != null)
      entries.push({
        label: t("creatorProfile.details.isBrandAccount"),
        value: yesNo(raw.isBrandAccount),
      });
    if (raw.isInfluDataVerified != null)
      entries.push({
        label: t("creatorProfile.details.isVerified"),
        value: yesNo(raw.isInfluDataVerified),
      });
    if (raw.agencyDomain)
      entries.push({
        label: t("creatorProfile.details.agency"),
        value: raw.agencyDomain,
      });
    if (raw.stars != null)
      entries.push({
        label: t("creatorProfile.details.stars"),
        value: formatNumber(raw.stars),
      });
    if (raw.socialHandles && typeof raw.socialHandles === "object") {
      for (const [key, value] of Object.entries(raw.socialHandles)) {
        if (typeof value === "string" && value.trim() !== "") {
          entries.push({ label: key, value });
        }
      }
    }
    return entries;
  }, [stats.raw_json, t]);

  const growth = stats.monthly_growth_followers;
  const growthTrend = growth == null ? null : growth > 0 ? "up" : growth < 0 ? "down" : null;
  const visibleMentions = allMentions ? mentions : mentions.slice(0, 15);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {t("creatorProfile.asOf", {
            date: formatRelativeDate(stats.fetched_at),
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={refreshing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"}
          />
          {t("creatorProfile.refresh")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("creatorProfile.kpi.followers")}
          value={formatNumber(stats.followers)}
        />
        <KpiCard
          label={t("creatorProfile.kpi.engagementRate")}
          value={formatPercent(stats.engagement_rate)}
        />
        <KpiCard
          label={t("creatorProfile.kpi.medianViews")}
          value={formatNumber(stats.median_views_per_post)}
        />
        <KpiCard
          label={t("creatorProfile.kpi.growth")}
          value={
            growth == null
              ? "–"
              : `${growth > 0 ? "+" : ""}${formatNumber(growth)}`
          }
          hint={
            stats.monthly_growth_rate == null
              ? null
              : formatPercent(stats.monthly_growth_rate)
          }
          trend={growthTrend}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("creatorProfile.kpi.following")}
          value={formatNumber(stats.following)}
        />
        <KpiCard
          label={t("creatorProfile.kpi.posts")}
          value={formatNumber(stats.posts_count)}
        />
        <KpiCard
          label={t("creatorProfile.kpi.avgLikes")}
          value={formatNumber(stats.avg_likes_per_post)}
        />
        <KpiCard
          label={t("creatorProfile.kpi.avgComments")}
          value={formatNumber(stats.avg_comments_per_post)}
        />
        {platform === "instagram" && stats.engagement_reels != null ? (
          <KpiCard
            label={t("creatorProfile.kpi.engagementReels")}
            value={formatPercent(stats.engagement_reels)}
          />
        ) : null}
        {platform === "instagram" && stats.median_plays_per_reel != null ? (
          <KpiCard
            label={t("creatorProfile.kpi.medianPlays")}
            value={formatNumber(stats.median_plays_per_reel)}
          />
        ) : null}
      </div>

      {stats.bio ||
      stats.public_email ||
      stats.website ||
      stats.gender ||
      stats.language ? (
        <Section title={t("creatorProfile.sections.bio")}>
          <Card>
            <CardContent className="space-y-3 p-4">
              {stats.bio ? (
                <p className="whitespace-pre-line text-sm">{stats.bio}</p>
              ) : null}
              <div className="flex flex-wrap gap-4 text-sm">
                {stats.public_email ? (
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={`mailto:${stats.public_email}`}
                  >
                    {stats.public_email}
                  </a>
                ) : null}
                {stats.website ? (
                  <a
                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    href={stats.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {stats.website}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {stats.gender ? (
                  <span className="text-muted-foreground">{stats.gender}</span>
                ) : null}
                {stats.language ? (
                  <span className="text-muted-foreground">{stats.language}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {categories.length > 0 ? (
        <Section title={t("creatorProfile.sections.categories")}>
          <Card>
            <CardContent className="p-4">
              <BarList items={categories} />
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {visibleMentions.length > 0 ? (
        <Section title={t("creatorProfile.sections.mentions")}>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("creatorProfile.mentions.brand")}</TableHead>
                    <TableHead className="text-right">
                      {t("creatorProfile.mentions.posts")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("creatorProfile.mentions.reels")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("creatorProfile.mentions.stories")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMentions.map((m, i) => (
                    <TableRow key={`${m.mention ?? "m"}-${i}`}>
                      <TableCell>{m.displayName || m.mention || "–"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(m.postcount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(m.reelcount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(m.storycount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {mentions.length > 15 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAllMentions((v) => !v)}
            >
              {allMentions
                ? t("creatorProfile.showLess")
                : t("creatorProfile.showAll")}
            </Button>
          ) : null}
        </Section>
      ) : null}

      {content.length > 0 ? (
        <Section title={t("creatorProfile.sections.content")}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.slice(0, 12).map((c, i) => (
              <Card key={`${c.platformLink ?? "c"}-${i}`} className="overflow-hidden">
                <FallbackImage
                  src={c.imageUrl}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">
                      {c.kind === "reel"
                        ? t("creatorProfile.content.reel")
                        : t("creatorProfile.content.post")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(c.uploaded)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("creatorProfile.content.likes")}: {formatNumber(c.likes)} ·{" "}
                    {t("creatorProfile.content.comments")}:{" "}
                    {formatNumber(c.comments)}
                    {c.kind === "reel" && (c.plays != null || c.reach != null)
                      ? ` · ${t("creatorProfile.content.plays")}: ${formatNumber(
                          c.plays ?? c.reach,
                        )}`
                      : ""}
                  </div>
                  {c.kind === "reel" && c.commentPositivityRate != null ? (
                    <div className="text-xs text-muted-foreground">
                      {t("creatorProfile.content.positivity")}:{" "}
                      {formatPercent(asPercent(c.commentPositivityRate))}
                    </div>
                  ) : null}
                  {c.platformLink ? (
                    <a
                      href={c.platformLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                    >
                      {t("creatorProfile.content.open")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {details.length > 0 ? (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {t("creatorProfile.allDetails")}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <Card>
              <CardContent className="p-4">
                <KeyValueList entries={details} />
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
