import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/campaigns/drafts")({
  component: () => <Placeholder titleKey="placeholders.campaignsDrafts" />,
});
