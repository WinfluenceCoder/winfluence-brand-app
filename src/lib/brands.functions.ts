import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const chMobileRegex = /^(?:\+41\s?|0)(?:\d{2})\s?\d{3}\s?\d{2}\s?\d{2}$/;

const updateSchema = z.object({
  domain: z.string().trim().min(1).max(255),
  insta_url: z.string().trim().max(255).optional().nullable(),
  brand_name: z.string().trim().max(255).optional().nullable(),
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
    return row;
  });
