import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/messages/personal")({
  beforeLoad: () => {
    throw redirect({ to: "/messages", search: { type: "user", id: undefined } });
  },
  component: () => null,
});
