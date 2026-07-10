import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/messages/system")({
  component: () => <Placeholder titleKey="placeholders.messagesSystem" />,
});
