import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/influencers/search")({
  component: () => <Placeholder titleKey="placeholders.influencersSearch" />,
});
