import { z } from "zod";

export const PASSWORD_POLICY_HINT_KEY = "validation.password.hint";

export function makeStrongPasswordSchema(t: (k: string) => string) {
  return z
    .string()
    .min(12, t("validation.password.minLength"))
    .max(200)
    .regex(/[A-Z]/, t("validation.password.upper"))
    .regex(/[a-z]/, t("validation.password.lower"))
    .regex(/[0-9]/, t("validation.password.digit"))
    .regex(/[^A-Za-z0-9]/, t("validation.password.symbol"));
}
