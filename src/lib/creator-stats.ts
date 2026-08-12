import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Plattformen des CreatorProfile-Moduls. */
export const PLATFORMS = ["instagram", "tiktok", "youtube"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type FetchStatus =
  | "ok"
  | "pending_enrichment"
  | "processing"
  | "not_found"
  | "error";

export type CategoryEntry = { category?: string | null; ratio?: number | null };

export type MentionEntry = {
  mention?: string | null;
  displayName?: string | null;
  postcount?: number | null;
  reelcount?: number | null;
  storycount?: number | null;
};

export type ContentEntry = {
  imageUrl?: string | null;
  platformLink?: string | null;
  uploaded?: string | null;
  likes?: number | null;
  comments?: number | null;
  plays?: number | null;
  reach?: number | null;
  commentPositivityRate?: number | null;
};

export type RawJson = {
  mentions?: MentionEntry[] | null;
  postArray?: ContentEntry[] | null;
  reelArray?: ContentEntry[] | null;
  isPrivate?: boolean | null;
  isBrandAccount?: boolean | null;
  isInfluDataVerified?: boolean | null;
  agencyDomain?: string | null;
  socialHandles?: Record<string, unknown> | null;
  stars?: number | null;
} | null;

export type WeightedEntry = { name?: string | null; weight?: number | null };

export type AudienceAnalysis = {
  audienceType?: {
    realPeoplePercentage?: number | null;
    massFollowersPercentage?: number | null;
    suspiciousPercentage?: number | null;
    influencersPercentage?: number | null;
  } | null;
  averageBirthyearArray?:
    | {
        birthyear?: number | null;
        value?: number | null;
        valueMale?: number | null;
        valueFemale?: number | null;
      }[]
    | null;
  birthyearMedian?: number | null;
  genderMtoF?: { male?: number | null; female?: number | null } | null;
  countryArray?: { country?: string | null; value?: number | null }[] | null;
  cityArray?: { city?: string | null; value?: number | null }[] | null;
  languageArray?: { language?: string | null; value?: number | null }[] | null;
  stateArray?: { state?: string | null; value?: number | null }[] | null;
  audienceInterests?: WeightedEntry[] | null;
  brandAffinity?: WeightedEntry[] | null;
  reachabilityBuckets?: { code?: string | null; weight?: number | null }[] | null;
  lookalikes?: PersonEntry[] | null;
  notableAudience?: PersonEntry[] | null;
} | null;

export type PersonEntry = {
  username?: string | null;
  fullname?: string | null;
  followers?: number | null;
  engagementRate?: number | null;
  picture?: string | null;
  url?: string | null;
};

export type CpmRange = {
  perMill?: { from?: number | null; to?: number | null } | null;
  perContent?: { from?: number | null; to?: number | null } | null;
};

export type RawAudienceJson = {
  audienceAnalysis?: AudienceAnalysis;
  audienceAnalysisLikers?: AudienceAnalysis;
  audienceAnalysisCommenters?: AudienceAnalysis;
  cpms?: Record<string, CpmRange | null> | null;
} | null;

/** creator_social_stats fehlt in den generierten Supabase-Typen. */
export type CreatorSocialStats = {
  creator_id: number;
  platform: string;
  fetch_status: FetchStatus | string | null;
  error_message: string | null;
  fetched_at: string | null;
  checked_at: string | null;
  has_audience_data: boolean | null;
  audience_fetched_at: string | null;
  credibility_score: number | null;
  credibility_class: string | null;
  audience_real_people_pct: number | null;
  audience_country_top: string | null;
  audience_country_top_pct: number | null;
  audience_age_median: number | null;
  audience_female_pct: number | null;
  followers: number | null;
  following: number | null;
  posts_count: number | null;
  engagement_rate: number | null;
  engagement_reels: number | null;
  median_views_per_post: number | null;
  median_plays_per_reel: number | null;
  avg_likes_per_post: number | null;
  avg_comments_per_post: number | null;
  monthly_growth_followers: number | null;
  monthly_growth_rate: number | null;
  country: string | null;
  city: string | null;
  language: string | null;
  gender: string | null;
  categories: CategoryEntry[] | null;
  type_score: number | null;
  display_name: string | null;
  bio: string | null;
  profile_pic_url: string | null;
  public_email: string | null;
  website: string | null;
  handle: string | null;
  raw_json: RawJson;
  raw_audience_json: RawAudienceJson;
};

export type CreatorBase = {
  id: number;
  nick_name: string | null;
  first_name: string | null;
  last_name: string | null;
  e_mail_address: string | null;
  foto_url: string | null;
  insta_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  status: string | null;
};

export type CreatorProfileData = {
  creator: CreatorBase | null;
  stats: Partial<Record<Platform, CreatorSocialStats>>;
};

const CREATOR_FIELDS =
  "id, nick_name, first_name, last_name, e_mail_address, foto_url, insta_url, tiktok_url, youtube_url, status";

function describeError(error: {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}): string {
  return [
    error.message,
    error.code ? `code: ${error.code}` : null,
    error.details ? `details: ${error.details}` : null,
    error.hint ? `hint: ${error.hint}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

async function fetchCreatorProfile(
  creatorId: number,
): Promise<CreatorProfileData> {
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .select(CREATOR_FIELDS)
    .eq("id", creatorId)
    .limit(1)
    .maybeSingle();

  if (creatorError) {
    console.error("[creator-stats] creators query failed", creatorError);
    throw new Error(describeError(creatorError));
  }

  const { data: rows, error: statsError } = await supabase
    .from("creator_social_stats" as never)
    .select("*")
    .eq("creator_id", creatorId)
    .returns<CreatorSocialStats[]>();

  if (statsError) {
    console.error("[creator-stats] stats query failed", statsError);
    throw new Error(describeError(statsError));
  }

  const stats: Partial<Record<Platform, CreatorSocialStats>> = {};
  for (const row of rows ?? []) {
    const key = (row.platform ?? "").toLowerCase();
    if (isPlatform(key)) stats[key] = row;
  }

  return { creator: (creator as CreatorBase | null) ?? null, stats };
}

export function creatorProfileQueryOptions(creatorId: number) {
  return queryOptions({
    queryKey: ["creator-profile", creatorId] as const,
    queryFn: () => fetchCreatorProfile(creatorId),
  });
}

export type SyncResult = {
  skipped_fresh?: boolean;
  skipped_audience_fresh?: boolean;
  [key: string]: unknown;
};

/** Startet den Sync über die Edge Function; influData wird nie direkt aufgerufen. */
export async function syncCreatorStats(params: {
  creatorId: number;
  platform?: Platform;
  includeAudience?: boolean;
}): Promise<SyncResult> {
  const body: Record<string, unknown> = { creator_id: params.creatorId };
  if (params.platform) body.platform = params.platform;
  if (params.includeAudience) body.include_audience = true;

  const { data, error } = await supabase.functions.invoke("sync-creator-stats", {
    body,
  });

  if (error) {
    console.error("[creator-stats] sync failed", error);
    throw new Error(error.message);
  }
  return (data ?? {}) as SyncResult;
}
