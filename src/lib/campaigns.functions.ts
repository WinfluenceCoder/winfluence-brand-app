import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const urlOpt = z
  .string()
  .trim()
  .optional()
  .nullable()
  .refine((v) => !v || /^https?:\/\//i.test(v), { message: "url" });

const dateOpt = z.string().trim().optional().nullable();

const campaignSchema = z.object({
  title: z.string().trim().min(1).max(255),
  brand_name: z.string().trim().min(1).max(255),
  brand_logo_url: z.string().trim().min(1).max(1000),
  product: z.string().trim().min(1).max(255),
  briefing: z.string().trim().min(1).max(10000),
  campaign_visual_url: z.string().trim().min(1).max(1000),
  goal: z.string().trim().min(1).max(2000),
  targetgroup: z.string().trim().min(1).max(1000),
  key_message: z.string().trim().min(1).max(2000),
  budget: z.number().int().nonnegative(),
  start: z.string().trim().min(1),
  ende: z.string().trim().min(1),
  hashtags: z.string().trim().max(500).optional().nullable(),
  link_list: z.string().trim().max(2000).optional().nullable(),
  requirements: z.string().trim().min(1).max(10000),
  post_type: z.string().trim().max(255).optional().nullable(),
  type: z.string().trim().min(1).max(100),
  target_url: urlOpt,
  coupon: z.string().trim().max(255).optional().nullable(),
  apply_till: dateOpt,
  barter_desc: z.string().trim().max(2000).optional().nullable(),
  barter_order_url: urlOpt,
  barter_order_coupon: z.string().trim().max(255).optional().nullable(),
  barter_value: z.number().int().nonnegative().optional().nullable(),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const getMyCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.number().int() }).parse(data))
  .handler(async ({ context, data }) => {
    const { data: brand, error: bErr } = await context.supabase
      .from("brands")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (bErr) throw new Error(bErr.message);
    if (!brand) throw new Error("no-brand");
    const { data: row, error } = await context.supabase
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .eq("brand_id", brand.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("not-found");
    return row;
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => campaignSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { data: brand, error: bErr } = await context.supabase
      .from("brands")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (bErr) throw new Error(bErr.message);
    if (!brand) throw new Error("no-brand");
    const payload = {
      ...data,
      brand_id: brand.id,
      status: "draft",
    } as unknown as never;
    const { data: row, error } = await context.supabase
      .from("campaigns")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    campaignSchema.extend({ id: z.number().int() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { data: brand, error: bErr } = await context.supabase
      .from("brands")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (bErr) throw new Error(bErr.message);
    if (!brand) throw new Error("no-brand");
    const { id, ...rest } = data;
    const patch = {
      ...rest,
      updated_at: new Date().toISOString(),
    } as unknown as never;
    const { data: row, error } = await context.supabase
      .from("campaigns")
      .update(patch)
      .eq("id", id)
      .eq("brand_id", brand.id)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

async function loadOwnedCampaign(
  ctx: { supabase: ReturnType<typeof Object>; userId: string } | any,
  id: number,
) {
  const { data: brand, error: bErr } = await ctx.supabase
    .from("brands")
    .select("id")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!brand) throw new Error("no-brand");
  const { data: row, error } = await ctx.supabase
    .from("campaigns")
    .select("id, status, brand_id")
    .eq("id", id)
    .eq("brand_id", brand.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("not-found");
  return { brand, row };
}

export const getCampaignDeletability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.number().int() }).parse(data))
  .handler(async ({ context, data }) => {
    const { row } = await loadOwnedCampaign(context, data.id);
    if (row.status !== "draft") {
      return { canDelete: false, reason: "status" as const };
    }
    const { count, error } = await context.supabase
      .from("collabs")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", data.id);
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) {
      return { canDelete: false, reason: "collabs" as const };
    }
    return { canDelete: true };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.number().int() }).parse(data))
  .handler(async ({ context, data }) => {
    const { brand, row } = await loadOwnedCampaign(context, data.id);
    if (row.status !== "draft") throw new Error("not-deletable-status");
    const { count, error: cErr } = await context.supabase
      .from("collabs")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", data.id);
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) throw new Error("has-collabs");
    const { error } = await context.supabase
      .from("campaigns")
      .delete()
      .eq("id", data.id)
      .eq("brand_id", brand.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const publishCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.number().int(),
        apply_till: z.string().trim().min(1),
        start: z.string().trim().min(1),
        ende: z.string().trim().min(1),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { brand, row } = await loadOwnedCampaign(context, data.id);
    if (row.status !== "draft") throw new Error("not-publishable-status");
    const apply = new Date(data.apply_till);
    const start = new Date(data.start);
    const ende = new Date(data.ende);
    const minApply = new Date();
    minApply.setDate(minApply.getDate() + 1);
    if (!(apply.getTime() >= minApply.getTime())) throw new Error("apply-till-min");
    if (!(start.getTime() > apply.getTime())) throw new Error("start-after-apply");
    if (!(ende.getTime() > start.getTime())) throw new Error("end-after-start");
    const patch = {
      status: "published",
      apply_till: apply.toISOString(),
      start: start.toISOString(),
      ende: ende.toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as never;
    const { error } = await context.supabase
      .from("campaigns")
      .update(patch)
      .eq("id", data.id)
      .eq("brand_id", brand.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

