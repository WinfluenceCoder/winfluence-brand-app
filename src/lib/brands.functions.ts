import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const chMobileRegex = /^(?:\+41\s?|0)(?:\d{2})\s?\d{3}\s?\d{2}\s?\d{2}$/;

const updateSchema = z.object({
  domain: z.string().trim().min(1).max(255),
  insta_url: z.string().trim().max(255).optional().nullable(),
  brand_name: z.string().trim().max(255).optional().nullable(),
  industry: z
    .enum([
      "beauty_cosmetics",
      "fashion_accessories",
      "lifestyle",
      "food_beverages",
      "fitness_health",
      "travel_tourism",
      "gaming",
      "tech_consumer_electronics",
      "entertainment",
      "finance",
      "automotive",
      "home_interior",
      "parenting_family",
      "education_career",
      "sustainability",
      "pets",
      "art_photography",
      "luxury",
      "real_estate",
      "b2b_business",
    ])
    .nullable()
    .optional(),
  brand_pitch: z.string().trim().max(2000).optional().nullable(),
  hashtags: z.string().trim().max(500).optional().nullable(),
  linkedin_url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => !v || /^https?:\/\//i.test(v), { message: "url" }),
  youtube_url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => !v || /^https?:\/\//i.test(v), { message: "url" }),
  tiktok_url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => !v || /^https?:\/\//i.test(v), { message: "url" }),
  billing_address_to: z.string().trim().max(255).optional().nullable(),
  billing_address_street: z.string().trim().max(255).optional().nullable(),
  billing_address_nr: z.number().int().nonnegative().optional().nullable(),
  billing_address_zip: z.number().int().nonnegative().optional().nullable(),
  billing_address_city: z.string().trim().max(255).optional().nullable(),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  job_title: z.string().trim().max(150).optional().nullable(),
  user_linkedin_url: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .refine((v) => !v || /^https?:\/\//i.test(v), { message: "url" }),
  gender: z.enum(["female", "male", "diverse"]),
  mobile: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((v) => !v || chMobileRegex.test(v), { message: "mobileCH" }),
  logo_url: z.string().trim().max(1000).optional().nullable(),
  user_foto_url: z.string().trim().max(1000).optional().nullable(),
});

export type BrandUpdateInput = z.infer<typeof updateSchema>;

export const getMyBrand = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("brands")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

function computeProfileQuality(row: Record<string, unknown>, colCount: number): number {
  if (!colCount || colCount <= 0) return 1;
  let n = 0;
  for (const key of Object.keys(row)) {
    const v = row[key];
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    n += 1;
  }
  const v = Math.round((n / colCount) * 100);
  return Math.min(100, Math.max(1, v));
}

export const updateMyBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { gender, ...rest } = data;
    const patch = {
      ...rest,
      is_female: gender === "female",
      is_male: gender === "male",
    };
    const { data: row, error } = await context.supabase
      .from("brands")
      .update(patch)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    let colCount = Object.keys(row ?? {}).length;
    const { data: rpcCount, error: rpcError } = await (
      context.supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: number | null; error: { message: string } | null }>
    )("get_brands_column_count");
    if (!rpcError && typeof rpcCount === "number" && rpcCount > 0) {
      colCount = rpcCount;
    }

    const quality = computeProfileQuality(row as Record<string, unknown>, colCount);

    const { data: updated, error: qErr } = await context.supabase
      .from("brands")
      .update({ profile_quality: quality } as never)
      .eq("user_id", context.userId)
      .select("*")
      .single();
    if (qErr) throw new Error(qErr.message);
    return updated;
  });
