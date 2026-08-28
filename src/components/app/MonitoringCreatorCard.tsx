import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  Eye,
  Heart,
  Instagram,
  MessageCircle,
  Share2,
  User,
  Youtube,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { creatorStatusLabel, TikTokIcon } from "@/components/app/CreatorsTable";
import {
  formatChf,
  formatMatchPercent,
  formatNumberCh,
  matchBadgeClasses,
} from "@/lib/campaign-curation";
import {
  effectiveCpe,
  type MonitoringCollab,
} from "@/lib/campaign-monitoring";
import { cn } from "@/lib/utils";

function statusVariant(
  s: string | null,
): "default" | "secondary" | "outline" | "hired" | "working" {
  switch (s) {
    case "hired":
      return "hired";
    case "working":
      return "working";
    case "delivered":
    case "approved":
      return "outline";
    default:
      return "secondary";
  }
}

/** Badge-Farben der rechten Spalte: delivered schwarz, approved grün, rejected dezent rot. */
function deliveredBadgeClasses(status: string | null): string {
  if (status === "approved") {
    return "border-transparent bg-emerald-600 text-white";
  }
  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300";
  }
  return "border-transparent bg-foreground text-background";
}

function SocialStat({
  url,
  Icon,
  label,
  value,
  rate,
  title,
}: {
  url: string | null;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  rate?: number | null;
  title: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={title}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {value === null ? (
        <span className="text-muted-foreground/60">–</span>
      ) : (
        <span className="tabular-nums">
          {formatNumberCh(value)}
          {rate != null ? ` (${rate.toFixed(1)}%)` : ""}
        </span>
      )}
    </a>
  );
}

function AvatarWithMatch({ collab }: { collab: MonitoringCollab }) {
  const c = collab.creator;
  const matchLabel = formatMatchPercent(collab.match);
  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-1">
      <Avatar className="h-12 w-12">
        {c.foto_url ? <AvatarImage src={c.foto_url} alt="" /> : null}
        <AvatarFallback>
          <User className="h-5 w-5 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      {matchLabel ? (
        <Badge
          variant="outline"
          className={cn(
            "border-transparent px-1.5 py-0 text-[10px] font-semibold tabular-nums",
            matchBadgeClasses(collab.match),
          )}
        >
          {matchLabel}
        </Badge>
      ) : null}
    </div>
  );
}

function HiredBody({ collab }: { collab: MonitoringCollab }) {
  const { t } = useTranslation();
  const c = collab.creator;
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const hasOffer = Boolean(collab.platform || collab.post_type);

  return (
    <div className="flex gap-3 p-3">
      <AvatarWithMatch collab={collab} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium">
            {c.nick_name || fullName || "–"}
          </span>
          <Badge variant={statusVariant(collab.status)} className="shrink-0">
            {creatorStatusLabel(t, collab.status)}
          </Badge>
          <span className="ml-auto shrink-0 text-sm tabular-nums">
            {formatChf(collab.price)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SocialStat
            url={c.insta_url}
            Icon={Instagram}
            label="Instagram"
            value={c.instagram_followers}
            rate={c.instagram_engagement_rate}
            title={t("creatorCard.followers", { platform: "Instagram" })}
          />
          <SocialStat
            url={c.tiktok_url}
            Icon={TikTokIcon}
            label="TikTok"
            value={c.tiktok_followers}
            rate={c.tiktok_engagement_rate}
            title={t("creatorCard.followers", { platform: "TikTok" })}
          />
          <SocialStat
            url={c.youtube_url}
            Icon={Youtube}
            label="YouTube"
            value={c.youtube_subscribers}
            rate={c.youtube_engagement_rate}
            title={t("creatorCard.subscribers", { platform: "YouTube" })}
          />
        </div>
        {hasOffer ? (
          <p className="text-xs text-muted-foreground">
            {t("creatorCard.offer")}: {collab.platform ?? "–"} ·{" "}
            {collab.post_type ?? "–"}
          </p>
        ) : null}
        {collab.pitch ? (
          <p className="line-clamp-3 text-xs text-muted-foreground">
            {collab.pitch}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function DeliveredBody({ collab }: { collab: MonitoringCollab }) {
  const { t } = useTranslation();
  const c = collab.creator;
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const ecpe = effectiveCpe(collab);
  const content = collab.content;

  return (
    <div className="flex gap-3 p-3">
      <AvatarWithMatch collab={collab} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium">
            {c.nick_name || fullName || "–"}
          </span>
          <Badge className={cn("shrink-0", deliveredBadgeClasses(collab.status))}>
            {creatorStatusLabel(t, collab.status)}
          </Badge>
          {content?.platform_link ? (
            <a
              href={content.platform_link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("campaigns.monitor.openContent")}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 items-center text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <span className="ml-auto shrink-0 text-sm tabular-nums">
            {formatChf(collab.price)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t("campaigns.monitor.deliveredLabel")}: {collab.platform ?? "–"} ·{" "}
            {collab.post_type ?? "–"}
          </span>
          <span className="text-xs font-semibold tabular-nums">
            {ecpe != null ? `eCPE: ${formatChf(ecpe)}` : "eCPE: –"}
          </span>
        </div>
        {content ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {content.reach === null ? "–" : formatNumberCh(content.reach)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {content.likes === null ? "–" : formatNumberCh(content.likes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {content.comments === null ? "–" : formatNumberCh(content.comments)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" />
              {content.shares === null ? "–" : formatNumberCh(content.shares)}
            </span>
          </div>
        ) : null}
        {collab.delivery_note ? (
          <p className="line-clamp-3 text-xs text-muted-foreground">
            {collab.delivery_note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function MonitoringCreatorCard({
  collab,
  onOpen,
}: {
  collab: MonitoringCollab;
  onOpen: (collab: MonitoringCollab) => void;
}) {
  const isDelivered =
    collab.status === "delivered" ||
    collab.status === "approved" ||
    collab.status === "rejected";
  return (
    <Card
      onClick={() => onOpen(collab)}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      {isDelivered ? (
        <DeliveredBody collab={collab} />
      ) : (
        <HiredBody collab={collab} />
      )}
    </Card>
  );
}
