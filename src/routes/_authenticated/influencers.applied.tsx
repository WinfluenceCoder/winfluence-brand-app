import { createFileRoute } from "@tanstack/react-router";
import { CreatorsListPage } from "@/components/app/CreatorsListPage";
import { creatorsListQueryOptions } from "@/lib/creators-list";

export const Route = createFileRoute("/_authenticated/influencers/applied")({
  loader: ({ context }) => {
    void context.queryClient
      .prefetchQuery(
        creatorsListQueryOptions({
          status: ["applied", "selected"],
          brandScoped: true,
        }),
      )
      .catch(() => {});
  },
  component: () => (
    <CreatorsListPage
      titleKey="creatorsList.titleApplied"
      statuses={["applied", "selected"]}
      brandScoped
    />
  ),
});
