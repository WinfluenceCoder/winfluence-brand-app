import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/campaigns/published")({
  component: () => <Placeholder titleKey="placeholders.campaignsPublished" />,
});
