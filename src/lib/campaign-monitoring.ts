import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CurationCollab, CurationCreator } from "@/lib/campaign-curation";

export type MonitoringCollab = CurationCollab & {
  platform: string | null;
  post_type: string | null;
};

const CREATOR_FIELDS =
  "id, nick_name, first_name, last_name, foto_url, e_mail_address, mobile, insta_url, tiktok_url, youtube_url, linkedin_url, status, address_street, address_nr, address_zip, address_city, company_legal_name";

const MONITORING_STATUSES = ["hired", "working", "delivered"] as const;

type Raw = {
  id: number;
  status: string | null;
  price: number | null;
  pitch: string | null;
  rank: number | null;
  match: number | null;
  platform: string | null;
  post_type: string | null;
  creators: CurationCreator | null;
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

async function fetchMonitoringCollabs(campaignId: number): Promise<MonitoringCollab[]> {
  const { data, error } = await supabase
    .from("collabs")
    .select(
      `id, status, price, pitch, rank, match, platform, post_type, creators!inner(${CREATOR_FIELDS})`,
    )
    .eq("campaign_id", campaignId)
    .in("status", [...MONITORING_STATUSES])
    .order("rank", { ascending: true })
    .returns<Raw[]>();

  if (error) {
    console.error("[campaign-monitoring] collabs query failed", error);
    throw new Error(describe(error));
  }

  return (data ?? [])
    .filter((r): r is Raw & { creators: CurationCreator } => r.creators != null)
    .map((r) => ({
      id: r.id,
      status: r.status,
      price: r.price,
      pitch: r.pitch,
      rank: r.rank,
      match: r.match,
      platform: r.platform,
      post_type: r.post_type,
      creator: r.creators,
    }));
}

export function monitoringQueryOptions(campaignId: number) {
  return queryOptions({
    queryKey: ["campaign-monitoring", campaignId] as const,
    queryFn: () => fetchMonitoringCollabs(campaignId),
  });
}
