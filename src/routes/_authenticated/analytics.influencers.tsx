import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/analytics/influencers")({
  component: () => <Placeholder titleKey="placeholders.analyticsInfluencers" />,
});
