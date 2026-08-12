import { Suspense } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { CreatorProfile } from "@/components/app/creator-profile/CreatorProfile";
import { SectionSkeleton } from "@/components/app/creator-profile/primitives";
import { creatorProfileQueryOptions } from "@/lib/creator-stats";

export const Route = createFileRoute("/_authenticated/influencers/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      creatorProfileQueryOptions(Number(params.id)),
    );
  },
  errorComponent: ({ error }) => (
    <div className="p-8 text-sm text-destructive" role="alert">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">–</div>
  ),
  component: CreatorProfilePage,
});

function CreatorProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = Route.useParams();

  return (
    <div className="p-8">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </button>
      <Suspense fallback={<SectionSkeleton rows={4} />}>
        <CreatorProfile creatorId={Number(id)} />
      </Suspense>
    </div>
  );
}
