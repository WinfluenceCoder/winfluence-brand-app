import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const INVITE_PAGE_SIZE = 25;

export type InviteCreatorRow = {
  id: number;
  nick_name: string | null;
  first_name: string | null;
  last_name: string | null;
  foto_url: string | null;
  insta_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  /** Status der Collab zu DIESER Kampagne, null = keine Collab */
  collabStatus: string | null;
  /** Durchschnittliches brand_rating über alle Kampagnen */
  avgRating: number | null;
};

function describe(error: {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}) {
  return [
    error.message,
    error.code ? `code: ${error.code}` : null,
    error.details ? `details: ${error.details}` : null,
    error.hint ? `hint: ${error.hint}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

type CreatorRaw = Omit<InviteCreatorRow, "collabStatus" | "avgRating">;

type CollabRaw = {
  creator_id: number;
  campaign_id: number;
  status: string | null;
  brand_rating: number | null;
};

async function fetchInviteCreators(
  campaignId: number,
): Promise<InviteCreatorRow[]> {
  const [creatorsRes, collabsRes] = await Promise.all([
    supabase
      .from("creators")
      .select(
        "id, nick_name, first_name, last_name, foto_url, insta_url, tiktok_url, youtube_url",
      )
      .eq("status", "active")
      .order("nick_name", { ascending: true })
      .returns<CreatorRaw[]>(),
    supabase
      .from("collabs")
      .select("creator_id, campaign_id, status, brand_rating")
      .returns<CollabRaw[]>(),
  ]);

  if (creatorsRes.error) {
    console.error("[campaign-invite] creators query failed", creatorsRes.error);
    throw new Error(describe(creatorsRes.error));
  }
  if (collabsRes.error) {
    console.error("[campaign-invite] collabs query failed", collabsRes.error);
    throw new Error(describe(collabsRes.error));
  }

  const statusByCreator = new Map<number, string | null>();
  const ratings = new Map<number, number[]>();
  for (const c of collabsRes.data ?? []) {
    if (c.campaign_id === campaignId) {
      statusByCreator.set(c.creator_id, c.status);
    }
    if (typeof c.brand_rating === "number") {
      const list = ratings.get(c.creator_id) ?? [];
      list.push(c.brand_rating);
      ratings.set(c.creator_id, list);
    }
  }

  return (creatorsRes.data ?? []).map((c) => {
    const list = ratings.get(c.id);
    return {
      ...c,
      collabStatus: statusByCreator.has(c.id)
        ? (statusByCreator.get(c.id) ?? null)
        : null,
      avgRating:
        list && list.length > 0
          ? list.reduce((a, b) => a + b, 0) / list.length
          : null,
    };
  });
}

export function inviteCreatorsQueryOptions(campaignId: number) {
  return queryOptions({
    queryKey: ["campaign-invite", campaignId] as const,
    queryFn: () => fetchInviteCreators(campaignId),
  });
}

export type InviteResult = {
  campaign_id: number;
  invited: number;
  skipped: number;
};

export async function inviteCreators(
  campaignId: number,
  creatorIds: number[],
): Promise<InviteResult> {
  if (creatorIds.length === 0) {
    return { campaign_id: campaignId, invited: 0, skipped: 0 };
  }
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>
  )("invite_creators", {
    p_campaign_id: campaignId,
    p_creator_ids: creatorIds,
  });
  if (error) throw new Error(describe(error));
  return data as InviteResult;
}

const rf = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatRating(value: number | null): string {
  return value === null ? "–" : rf.format(value);
}

export function creatorInitials(row: InviteCreatorRow): string {
  const base =
    [row.first_name, row.last_name].filter(Boolean).join(" ") ||
    row.nick_name ||
    "";
  const parts = base.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
