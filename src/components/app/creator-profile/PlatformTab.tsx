import { useTranslation } from "react-i18next";
import { AlertTriangle, Database, Loader2, MapPin, RefreshCw, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/format";
import type { CreatorSocialStats, Platform } from "@/lib/creator-stats";
import { PlatformStats } from "./PlatformStats";
import { AudienceSection } from "./AudienceSection";
import { SectionSkeleton } from "./primitives";

export function PlatformTab({
  platform,
  stats,
  onSync,
  onLoadAudience,
  syncing,
  audienceLoading,
}: {
  platform: Platform;
  stats: CreatorSocialStats | undefined;
  onSync: () => void;
  onLoadAudience: () => void;
  syncing: boolean;
  audienceLoading: boolean;
}) {
  const { t } = useTranslation();

  if (syncing && !stats) return <SectionSkeleton rows={4} />;

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Database className="h-10 w-10 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {t("creatorProfile.empty.title")}
          </div>
          <Button onClick={onSync} disabled={syncing}>
            {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("creatorProfile.empty.load")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = stats.fetch_status ?? "";

  if (status === "pending_enrichment" || status === "processing") {
    return (
      <Alert>
        <AlertTitle>{t("creatorProfile.pending.title")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {t("creatorProfile.pending.checked", {
              date: formatRelativeDate(stats.checked_at),
            })}
          </p>
          <Button variant="outline" size="sm" onClick={onSync} disabled={syncing}>
            <RefreshCw
              className={syncing ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"}
            />
            {t("creatorProfile.pending.recheck")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "not_found") {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("creatorProfile.notFound.title")}</AlertTitle>
        <AlertDescription>
          {t("creatorProfile.notFound.handle", { handle: stats.handle ?? "–" })}
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("creatorProfile.error.title")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{stats.error_message ?? "–"}</p>
          <Button variant="outline" size="sm" onClick={onSync} disabled={syncing}>
            {t("creatorProfile.error.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-10">
      <PlatformStats
        stats={stats}
        platform={platform}
        onRefresh={onSync}
        refreshing={syncing}
      />
      {platform === "instagram" ? (
        <AudienceSection
          stats={stats}
          onLoadAudience={onLoadAudience}
          loading={audienceLoading}
        />
      ) : null}
    </div>
  );
}
