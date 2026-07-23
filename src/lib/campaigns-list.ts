import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const CAMPAIGN_STATUSES = [
  "draft",
  "published",
  "running",
  "expired",
  "ended",
  "approved",
  "archived",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export type CampaignListRow = {
  id: number;
  title: string | null;
  status: string | null;
  start: string | null;
  ende: string | null;
  budget: number | null;
  campaign_visual_url: string | null;
};

export type CampaignsListParams = {
  status?: CampaignStatus;
  statusIn?: readonly CampaignStatus[];
};

async function fetchCampaigns(params: CampaignsListParams): Promise<CampaignListRow[]> {
  const { data: brand } = await supabase.from("brands").select("id").maybeSingle();
  if (!brand) return [];

  let query = supabase
    .from("campaigns")
    .select("id, title, status, start, ende, budget, campaign_visual_url")
    .eq("brand_id", brand.id);

  if (params.status) {
    query = query.eq("status", params.status);
  } else if (params.statusIn && params.statusIn.length > 0) {
    query = query.in("status", params.statusIn as unknown as string[]);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .returns<CampaignListRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function campaignsListQueryOptions(params: CampaignsListParams = {}) {
  const key = params.status
    ? (["campaigns", "list", params.status] as const)
    : params.statusIn && params.statusIn.length > 0
      ? (["campaigns", "list", "in", [...params.statusIn].sort().join(",")] as const)
      : (["campaigns", "list", "all"] as const);
  return queryOptions({
    queryKey: key,
    queryFn: () => fetchCampaigns(params),
  });
}
