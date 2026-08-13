import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Instagram, MapPin, User, Youtube } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TikTokIcon } from "@/components/app/CreatorsTable";
import {
  creatorProfileQueryOptions,
  PLATFORMS,
  syncCreatorStats,
  type Platform,
} from "@/lib/creator-stats";
import { PlatformTab } from "./PlatformTab";

const PLATFORM_ICONS: Record<
  Platform,
  React.ComponentType<{ className?: string }>
> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  youtube: Youtube,
};

export function CreatorProfile({ creatorId }: { creatorId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(creatorProfileQueryOptions(creatorId));
  const [audiencePlatform, setAudiencePlatform] = useState<Platform | null>(null);

  const creator = data.creator;
  const urls: Record<Platform, string | null> = {
    instagram: creator?.insta_url ?? null,
    tiktok: creator?.tiktok_url ?? null,
    youtube: creator?.youtube_url ?? null,
  };

  const defaultTab = useMemo<Platform>(() => {
    const withData = PLATFORMS.find((p) => data.stats[p]);
    if (withData) return withData;
    const withUrl = PLATFORMS.find((p) => urls[p]);
    return withUrl ?? "instagram";
  }, [data.stats, urls.instagram, urls.tiktok, urls.youtube]);

  const [tab, setTab] = useState<Platform>(defaultTab);
  const activePlatform = tab;

  const sync = useMutation({
    mutationFn: (vars: { platform: Platform; includeAudience?: boolean }) =>
      syncCreatorStats({
        creatorId,
        platform: vars.platform,
        includeAudience: vars.includeAudience,
      }),
    onSuccess: async (result, vars) => {
      if (result.skipped_fresh) {
        toast.info(t("creatorProfile.toast.skippedFresh"));
      } else if (result.skipped_audience_fresh) {
        toast.info(t("creatorProfile.toast.skippedAudienceFresh"));
      } else {
        toast.success(
          vars.includeAudience
            ? t("creatorProfile.toast.audienceLoaded")
            : t("creatorProfile.toast.synced"),
        );
      }
      await queryClient.invalidateQueries({
        queryKey: ["creator-profile", creatorId],
      });
    },
    onError: (error: Error) => {
      toast.error(t("creatorProfile.toast.error"), {
        description: error.message,
      });
    },
    onSettled: () => setAudiencePlatform(null),
  });

  const syncing = sync.isPending && !sync.variables?.includeAudience;
  const audienceLoading =
    sync.isPending && !!sync.variables?.includeAudience;

  if (!creator) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("creatorsList.notFound")}
      </div>
    );
  }

  const displayName =
    creator.nick_name ||
    [creator.first_name, creator.last_name].filter(Boolean).join(" ") ||
    "–";
  const fullName = [creator.first_name, creator.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
        <Avatar className="h-20 w-20">
          {creator.foto_url ? (
            <AvatarImage src={creator.foto_url} alt="" />
          ) : null}
          <AvatarFallback>
            <User className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium">{fullName || "–"}</div>
          <div className="text-sm italic text-muted-foreground">
            {t("creatorProfile.claimPlaceholder")}
          </div>
        </div>
        <p className="max-w-prose text-sm italic text-muted-foreground">
          {t("creatorProfile.bioPlaceholder")}
        </p>
        {PLATFORMS.filter((p) => urls[p]).length > 0 ? (
          <div className="flex items-center gap-3 text-primary">
            {PLATFORMS.filter((p) => urls[p]).map((p) => {
              const Icon = PLATFORM_ICONS[p];
              return (
                <a
                  key={p}
                  href={urls[p] ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80"
                  aria-label={p}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        ) : null}
      </section>


      <Tabs value={tab} onValueChange={(v) => setTab(v as Platform)}>
        <TabsList>
          {PLATFORMS.map((p) => {
            const Icon = PLATFORM_ICONS[p];
            const disabled = !urls[p] && !data.stats[p];
            const trigger = (
              <TabsTrigger
                value={p}
                disabled={disabled}
                className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                <Icon className="h-4 w-4" />
                {t(`creatorProfile.platform.${p}`)}
              </TabsTrigger>
            );
            return disabled ? (
              <Tooltip key={p}>
                <TooltipTrigger asChild>
                  <span>{trigger}</span>
                </TooltipTrigger>
                <TooltipContent>
                  {t("creatorProfile.noProfile")}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span key={p}>{trigger}</span>
            );
          })}
        </TabsList>

        {PLATFORMS.map((p) => (
          <TabsContent key={p} value={p} className="pt-6">
            <PlatformTab
              platform={p}
              stats={data.stats[p]}
              onSync={() => sync.mutate({ platform: p })}
              onLoadAudience={() => {
                setAudiencePlatform(p);
                sync.mutate({ platform: p, includeAudience: true });
              }}
              syncing={syncing && sync.variables?.platform === p}
              audienceLoading={audienceLoading && audiencePlatform === p}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
