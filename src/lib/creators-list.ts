import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const COLLAB_STATUSES = ["applied", "hired"] as const;

export type CollabStatus = (typeof COLLAB_STATUSES)[number];

export type CreatorListRow = {
  id: number;
  nick_name: string | null;
  first_name: string | null;
  last_name: string | null;
  foto_url: string | null;
  e_mail_address: string | null;
  mobile: string | null;
  insta_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  collabStatus: string | null;
};

export type CreatorsListParams = {
  /** Filter auf collabs.status */
  status?: readonly string[];
  /** Nur Collabs zu Kampagnen des aktuellen Brands */
  brandScoped?: boolean;
};

type CollabRow = {
  status: string | null;
  created_at: string | null;
  campaigns: { brand_id: number | null } | null;
  creators: Omit<CreatorListRow, "collabStatus"> | null;
};

async function currentBrandId(): Promise<number | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;
  const { data: brand } = await supabase
    .from("brands")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return brand?.id ?? null;
}

async function fetchCreators(
  params: CreatorsListParams,
): Promise<CreatorListRow[]> {
  let brandId: number | null = null;
  if (params.brandScoped) {
    brandId = await currentBrandId();
    if (!brandId) return [];
  }

  let query = supabase
    .from("collabs")
    .select(
      "status, created_at, campaigns!inner(brand_id), creators!inner(id, nick_name, first_name, last_name, foto_url, e_mail_address, mobile, insta_url, tiktok_url, youtube_url, linkedin_url)",
    );

  if (params.status && params.status.length > 0) {
    query = query.in("status", params.status as unknown as string[]);
  }
  if (brandId != null) {
    query = query.eq("campaigns.brand_id", brandId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .returns<CollabRow[]>();

  if (error) throw new Error(error.message);

  const seen = new Set<number>();
  const rows: CreatorListRow[] = [];
  for (const c of data ?? []) {
    const creator = c.creators;
    if (!creator || seen.has(creator.id)) continue;
    seen.add(creator.id);
    rows.push({ ...creator, collabStatus: c.status });
  }
  return rows;
}

export function creatorsListQueryOptions(params: CreatorsListParams = {}) {
  const statusKey = params.status ? [...params.status].sort().join(",") : "all";
  return queryOptions({
    queryKey: [
      "creators",
      "list",
      statusKey,
      params.brandScoped ? "brand" : "global",
    ] as const,
    queryFn: () => fetchCreators(params),
  });
}

export type CreatorDetail = CreatorListRow & {
  status: string | null;
  address_street: string | null;
  address_nr: number | null;
  address_zip: number | null;
  address_city: string | null;
  company_legal_name: string | null;
};

export function creatorDetailQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["creators", "detail", id] as const,
    queryFn: async (): Promise<CreatorDetail | null> => {
      const { data, error } = await supabase
        .from("creators")
        .select(
          "id, nick_name, first_name, last_name, foto_url, e_mail_address, mobile, insta_url, tiktok_url, youtube_url, linkedin_url, status, address_street, address_nr, address_zip, address_city, company_legal_name",
        )
        .eq("id", id)
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return { ...(data as Omit<CreatorDetail, "collabStatus">), collabStatus: null };
    },
  });
}
