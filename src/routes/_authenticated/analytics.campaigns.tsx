import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/analytics/campaigns")({
  component: () => <Placeholder titleKey="placeholders.analyticsCampaigns" />,
});
