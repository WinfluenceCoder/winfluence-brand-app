import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/campaigns/completed")({
  component: () => <Placeholder titleKey="placeholders.campaignsCompleted" />,
});
