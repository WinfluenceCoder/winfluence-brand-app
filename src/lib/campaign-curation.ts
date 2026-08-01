import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Platzhalter, bis echte Follower-Zahlen verfügbar sind. */
export const FOLLOWER_PLACEHOLDER = 1234;

export type CurationCreator = {
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
  status: string | null;
  address_street: string | null;
  address_nr: number | null;
  address_zip: number | null;
  address_city: string | null;
  company_legal_name: string | null;
};

export type CurationCollab = {
  id: number;
  status: string | null;
  price: number | null;
  pitch: string | null;
  rank: number | null;
  match: number | null;
  creator: CurationCreator;
};

const CREATOR_FIELDS =
  "id, nick_name, first_name, last_name, foto_url, e_mail_address, mobile, insta_url, tiktok_url, youtube_url, linkedin_url, status, address_street, address_nr, address_zip, address_city, company_legal_name";

type Raw = {
  id: number;
  status: string | null;
  price: number | null;
  pitch: string | null;
  rank: number | null;
  match: number | null;
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

async function fetchCurationCollabs(campaignId: number): Promise<CurationCollab[]> {
  const { data, error } = await supabase
    .from("collabs")
    .select(`id, status, price, pitch, rank, match, creators!inner(${CREATOR_FIELDS})`)
    .eq("campaign_id", campaignId)
    .in("status", ["applied", "selected"])
    .returns<Raw[]>();

  if (error) {
    console.error("[campaign-curation] collabs query failed", error);
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
      creator: r.creators,
    }));
}

export function curationQueryOptions(campaignId: number) {
  return queryOptions({
    queryKey: ["campaign-curation", campaignId] as const,
    queryFn: () => fetchCurationCollabs(campaignId),
  });
}

export async function setCollabStatus(collabId: number, status: "applied" | "selected") {
  const { error } = await supabase
    .from("collabs")
    .update({ status, ...(status === "applied" ? { rank: null } : {}) })
    .eq("id", collabId);
  if (error) throw new Error(describe(error));
}

/** Schreibt rank = 1..n in der übergebenen Reihenfolge. */
export async function saveRanks(collabIds: number[]) {
  for (let i = 0; i < collabIds.length; i++) {
    const { error } = await supabase
      .from("collabs")
      .update({ rank: i + 1 })
      .eq("id", collabIds[i]);
    if (error) throw new Error(describe(error));
  }
}

const nf = new Intl.NumberFormat("de-CH");
const cf = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 2,
});

export function formatNumberCh(value: number): string {
  return nf.format(value);
}

export function formatChf(value: number | null | undefined): string {
  return cf.format(value ?? 0);
}

/** Lokale (nur Browser-)Reihenfolge der rechten Liste. */
export function loadAppliedOrder(campaignId: number): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`curation:applied-order:${campaignId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function saveAppliedOrder(campaignId: number, ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `curation:applied-order:${campaignId}`,
      JSON.stringify(ids),
    );
  } catch {
    /* ignore */
  }
}
