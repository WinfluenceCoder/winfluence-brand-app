import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CREATOR_FIELDS,
  mapCreator,
  type CurationCollab,
  type RawCreator,
} from "@/lib/campaign-curation";

export type DeliveredContent = {
  id: string;
  platform: string | null;
  content_type: string | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  platform_link: string | null;
};

export type MonitoringCollab = CurationCollab & {
  delivery_note: string | null;
  content: DeliveredContent | null;
};

/** Status der rechten Spalte: gelieferte oder freigegebene Beiträge. */
export const DELIVERED_STATUSES = ["delivered", "approved"] as const;
const MONITORING_STATUSES = ["hired", "working", ...DELIVERED_STATUSES] as const;

type RawContent = DeliveredContent;

type Raw = {
  id: number;
  status: string | null;
  price: number | null;
  pitch: string | null;
  rank: number | null;
  match: number | null;
  platform: string | null;
  post_type: string | null;
  delivery_note: string | null;
  creator: RawCreator | null;
  content: RawContent | null;
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

const MONITORING_SELECT = `id, status, price, pitch, rank, match, platform, post_type, delivery_note, creator:creator_sedcard!inner(${CREATOR_FIELDS}), content:creator_content(id, platform, content_type, reach, likes, comments, shares, platform_link)`;

async function fetchMonitoringCollabs(campaignId: number): Promise<MonitoringCollab[]> {
  const { data, error } = await supabase
    .from("collabs")
    .select(MONITORING_SELECT)
    .eq("campaign_id", campaignId)
    .in("status", [...MONITORING_STATUSES])
    .order("rank", { ascending: true })
    .returns<Raw[]>();

  if (error) {
    console.error("[campaign-monitoring] collabs query failed", error);
    throw new Error(describe(error));
  }

  return (data ?? [])
    .filter((r): r is Raw & { creator: RawCreator } => r.creator != null)
    .map((r) => ({
      id: r.id,
      status: r.status,
      price: r.price,
      pitch: r.pitch,
      rank: r.rank,
      match: r.match,
      platform: r.platform,
      post_type: r.post_type,
      delivery_note: r.delivery_note,
      content: r.content ?? null,
      creator: mapCreator(r.creator),
    }));
}

export function monitoringQueryOptions(campaignId: number) {
  return queryOptions({
    queryKey: ["campaign-monitoring", campaignId] as const,
    queryFn: () => fetchMonitoringCollabs(campaignId),
  });
}

/** Engagements = likes + comments + shares. null, wenn kein Content oder alle drei null. */
export function contentEngagements(c: DeliveredContent | null): number | null {
  if (!c) return null;
  const likes = c.likes ?? 0;
  const comments = c.comments ?? 0;
  const shares = c.shares ?? 0;
  const sum = likes + comments + shares;
  if (sum === 0 && c.likes === null && c.comments === null && c.shares === null) {
    return null;
  }
  return sum;
}

/** eCPE = price / engagements. null, wenn engagements null/0 oder price null. */
export function effectiveCpe(collab: MonitoringCollab): number | null {
  const engagements = contentEngagements(collab.content);
  if (engagements === null || engagements <= 0 || collab.price === null) return null;
  return collab.price / engagements;
}
