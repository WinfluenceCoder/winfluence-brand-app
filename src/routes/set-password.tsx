import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/winfluence-logo.png";

export const Route = createFileRoute("/set-password")({
  component: SetPasswordPage,
});

const passwordSchema = z
  .string()
  .min(12, "Mindestens 12 Zeichen")
  .max(200)
  .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe")
  .regex(/[a-z]/, "Mindestens ein Kleinbuchstabe")
  .regex(/[0-9]/, "Mindestens eine Zahl")
  .regex(/[^A-Za-z0-9]/, "Mindestens ein Sonderzeichen");

const schema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwörter stimmen nicht überein",
  });

type FormValues = z.infer<typeof schema>;

function mapAuthError(err?: { message?: string | null; code?: string | null } | null) {
  const msg = (err?.message ?? "").toLowerCase();
  if (msg.includes("weak") || msg.includes("pwned")) return "Passwort zu schwach.";
  if (msg.includes("same")) return "Bitte ein neues Passwort wählen.";
  return err?.message || "Speichern fehlgeschlagen.";
}

function SetPasswordPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
    mode: "onChange",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setEmail(data.session?.user.email ?? null);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (v: FormValues) => {
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) {
      toast.error("Sitzung abgelaufen. Bitte melde dich beim Team.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: v.password });
    if (error) {
      toast.error(mapAuthError(error));
      return;
    }
    const { error: bErr } = await supabase
      .from("brands")
      .update({ status: "active" })
      .eq("user_id", userId);
    if (bErr) {
      // Nicht blockierend – User ist eingeloggt.
      console.warn("brand status update failed", bErr.message);
    }
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center mb-6">
          <img src={logo} alt="winfluence" className="h-8 w-auto mx-auto" />
          <h1 className="mt-3 text-xl font-semibold">Passwort setzen</h1>
        </div>

        {checking ? (
          <p className="text-center text-sm text-muted-foreground">Lade…</p>
        ) : !email ? (
          <p className="text-center text-sm text-muted-foreground">
            Dieser Link ist ungültig oder abgelaufen. Bitte melde dich beim Team.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={email} readOnly disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Neues Passwort</Label>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Min. 12 Zeichen, Gross-/Kleinbuchstabe, Zahl und Sonderzeichen.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Passwort bestätigen</Label>
              <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.formState.isValid}>
              Passwort setzen
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
