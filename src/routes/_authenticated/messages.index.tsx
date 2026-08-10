import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessagesList } from "@/components/app/MessagesList";
import { MessageReader } from "@/components/app/MessageReader";
import {
  MESSAGE_TYPES,
  type MessageType,
  messagesListQueryOptions,
  setMessageStatus,
  unreadCountsQueryOptions,
} from "@/lib/messages";

const searchSchema = z.object({
  type: fallback(z.string(), "all").default("all"),
  id: fallback(z.number().optional(), undefined),
});

function normalizeType(raw: string): "all" | MessageType {
  return (MESSAGE_TYPES as readonly string[]).includes(raw)
    ? (raw as MessageType)
    : "all";
}

export const Route = createFileRoute("/_authenticated/messages/")({
  validateSearch: zodValidator(searchSchema),
  component: MessagesPage,
  errorComponent: MessagesError,
  notFoundComponent: MessagesNotFound,
});

function MessagesError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Nachrichten</h1>
      <Alert variant="destructive" className="mt-6">
        <AlertTitle>Nachrichten konnten nicht geladen werden</AlertTitle>
        <AlertDescription className="break-words">{error.message}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        className="mt-4"
        onClick={() => {
          void router.invalidate();
          reset();
        }}
      >
        Erneut versuchen
      </Button>
    </div>
  );
}

function MessagesNotFound() {
  return (
    <div className="p-8 text-sm text-muted-foreground">
      Diese Nachricht existiert nicht (mehr).
    </div>
  );
}

function MessagesPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const type = normalizeType(search.type);
  const navigate = useNavigate({ from: "/messages/" });
  const qc = useQueryClient();

  const listOptions = messagesListQueryOptions(type === "all" ? {} : { type });
  const {
    data: messages = [],
    isLoading,
    refetch,
    error: listError,
  } = useQuery(listOptions);
  const { data: unread } = useQuery(unreadCountsQueryOptions());

  const selected = messages.find((m) => m.id === search.id) ?? null;

  const setType = (next: string) => {
    navigate({
      search: () => ({ type: next, id: undefined }) as never,
    });
  };

  const select = (id: number | undefined) => {
    navigate({ search: () => ({ type: search.type, id }) as never });
  };

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["messages"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "new" | "read" | "deleted" }) =>
      setMessageStatus(id, status),
    onSuccess: invalidate,
    onError: (error: Error) => {
      toast.error(error.message);
      invalidate();
    },
  });

  // Auto mark as read when opening a new message.
  useEffect(() => {
    if (selected && selected.status === "new" && !statusMutation.isPending) {
      statusMutation.mutate({ id: selected.id, status: "read" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.status]);

  const tabs: { value: string; label: string; count: number }[] = [
    { value: "all", label: t("messages.filter.all"), count: unread?.all ?? 0 },
    {
      value: "system",
      label: t("messages.nav.notifications"),
      count: unread?.system ?? 0,
    },
    { value: "user", label: t("messages.nav.personal"), count: unread?.user ?? 0 },
    {
      value: "moderator",
      label: t("messages.nav.winfluence"),
      count: unread?.moderator ?? 0,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("messages.title")}</h1>

      <Tabs value={type} onValueChange={setType} className="mt-6">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.label}
              {tab.count > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 flex gap-4">
        <Card
          className={`w-full overflow-hidden p-0 md:w-[400px] md:shrink-0 ${
            selected ? "hidden md:block" : "block"
          }`}
        >
          <MessagesList
            messages={messages}
            selectedId={selected?.id ?? null}
            onSelect={(id) => select(id)}
            isLoading={isLoading}
          />
        </Card>

        <Card
          className={`min-h-[480px] flex-1 overflow-hidden p-0 ${
            selected ? "block" : "hidden md:block"
          }`}
        >
          {selected ? (
            <MessageReader
              message={selected}
              busy={statusMutation.isPending}
              onBack={() => select(undefined)}
              onRefresh={() => void refetch()}
              onMarkUnread={() => {
                statusMutation.mutate({ id: selected.id, status: "new" });
                select(undefined);
              }}
              onDelete={() => {
                statusMutation.mutate({ id: selected.id, status: "deleted" });
                select(undefined);
              }}
            />
          ) : (
            <div className="flex h-full min-h-[480px] items-center justify-center p-8 text-sm text-muted-foreground">
              {t("messages.noSelection")}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
