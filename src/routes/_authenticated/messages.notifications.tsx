import { createFileRoute } from "@tanstack/react-router";
import { Placeholder } from "@/components/app/Placeholder";

export const Route = createFileRoute("/_authenticated/messages/notifications")({
  component: () => <Placeholder titleKey="placeholders.messagesNotifications" />,
});
