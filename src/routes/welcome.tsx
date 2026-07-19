import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/winfluence-logo.png";

type Search = { domain: string };

type WelcomeInfo = {
  found: boolean;
  first_name: string | null;
  sales_rep: string | null;
  email_masked: string | null;
  claimed: boolean;
};

export const Route = createFileRoute("/welcome")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    domain: typeof search.domain === "string" ? search.domain : "",
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { domain } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<WelcomeInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!domain.trim()) {
        navigate({ to: "/login", replace: true });
        return;
      }
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: { message: string } | null }>)(
        "get_welcome_info",
        { p_domain: domain },
      );
      if (cancelled) return;
      const row = (Array.isArray(data) ? data[0] : data) as WelcomeInfo | null;
      if (error || !row || !row.found || row.claimed) {
        navigate({ to: "/login", replace: true });
        return;
      }
      setInfo(row);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [domain, navigate]);

  const onClaim = async () => {
    if (!info) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-brand", {
        body: { domain },
      });
      console.log("claim-brand response", { data, error });
      const payload = data as { ok?: boolean; reason?: string; message?: string } | null;
      const ok = !error && payload?.ok === true;
      if (!ok) {
        const reason = payload?.reason ?? error?.message ?? "unknown";
        const message = payload?.message ? ` — ${payload.message}` : "";
        toast.error(`Fehler: ${reason}${message}`);
        return;
      }
      setDone(true);
    } catch (e) {
      console.error("claim-brand exception", e);
      toast.error(`Fehler: ${(e as Error).message ?? "exception"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="text-center mb-6">
          <img src={logo} alt="winfluence" className="h-8 w-auto mx-auto" />
        </div>

        {loading || !info ? (
          <p className="text-center text-sm text-muted-foreground">Lade…</p>
        ) : done ? (
          <div className="space-y-3 text-center">
            <h1 className="text-xl font-semibold">Fast geschafft!</h1>
            <p className="text-sm text-muted-foreground">
              Wir haben dir eine Nachricht an {info.email_masked} geschickt.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2 text-center">
              <h1 className="text-xl font-semibold">Hallo {info.first_name}!</h1>
              <p className="text-sm text-muted-foreground">
                {info.sales_rep} hat dein Dossier bereits vorbereitet.
                Konto mit {info.email_masked} anlegen?
              </p>
            </div>
            <Button className="w-full" onClick={onClaim} disabled={submitting}>
              {submitting ? "Wird angelegt…" : "Konto anlegen"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
