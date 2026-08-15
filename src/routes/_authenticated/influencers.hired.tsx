import { createFileRoute } from "@tanstack/react-router";
import { CreatorsListPage } from "@/components/app/CreatorsListPage";
import { creatorsListQueryOptions } from "@/lib/creators-list";

export const Route = createFileRoute("/_authenticated/influencers/hired")({
  loader: ({ context }) => {
    void context.queryClient
      .prefetchQuery(
        creatorsListQueryOptions({
          status: ["hired", "working", "delivered"],
          brandScoped: true,
        }),
      )
      .catch(() => {});
  },
  component: () => (
    <CreatorsListPage
      titleKey="creatorsList.titleHired"
      statuses={["hired", "working", "delivered"]}
      brandScoped
    />
  ),
});
