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
