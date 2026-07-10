import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { externalSupabase } from "@/integrations/external-supabase/client";

export const Route = createFileRoute("/external-check")({
  ssr: false,
  component: ExternalCheck,
});

type Status = { ok: boolean; message: string; details?: string };

function ExternalCheck() {
  const [status, setStatus] = useState<Status | null>(null);
  const url = import.meta.env.VITE_EXTERNAL_SUPABASE_URL as string;

  useEffect(() => {
    (async () => {
      try {
        // Hit the Auth health endpoint — works without any tables/RLS.
        const res = await fetch(`${url}/auth/v1/health`, {
          headers: {
            apikey: import.meta.env
              .VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY as string,
          },
        });
        const text = await res.text();
        if (!res.ok) {
          setStatus({
            ok: false,
            message: `Auth health check failed (${res.status})`,
            details: text,
          });
          return;
        }
        // Also confirm the JS client initializes and can read a session.
        const { error } = await externalSupabase.auth.getSession();
        if (error) {
          setStatus({
            ok: false,
            message: "Client init failed",
            details: error.message,
          });
          return;
        }
        setStatus({
          ok: true,
          message: "Connected to external Supabase ✅",
          details: text,
        });
      } catch (e) {
        setStatus({
          ok: false,
          message: "Network error",
          details: e instanceof Error ? e.message : String(e),
        });
      }
    })();
  }, [url]);

  return (
    <div className="min-h-screen p-8 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">External Supabase Connection</h1>
      <p className="mb-2">
        <strong>URL:</strong> {url}
      </p>
      {!status && <p>Testing…</p>}
      {status && (
        <div
          className={`mt-4 p-4 rounded border ${
            status.ok
              ? "border-green-500 bg-green-50 text-green-900"
              : "border-red-500 bg-red-50 text-red-900"
          }`}
        >
          <p className="font-semibold">{status.message}</p>
          {status.details && (
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              {status.details}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
