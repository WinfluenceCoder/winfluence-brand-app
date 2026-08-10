import { useTranslation } from "react-i18next";
import { formatDistanceToNow, isThisYear, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowDown, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageAvatar, useSenderLabel } from "@/components/app/MessageAvatar";
import type { MessageListItem } from "@/lib/messages";
import { cn } from "@/lib/utils";

export function formatMessageTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) {
    return formatDistanceToNow(date, { addSuffix: true, locale: de });
  }
  return date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    ...(isThisYear(date) ? {} : { year: "numeric" }),
  });
}

export function PrioIcon({ prio }: { prio: MessageListItem["prio"] }) {
  const { t } = useTranslation();
  if (prio === "high") {
    return (
      <AlertCircle
        className="h-4 w-4 shrink-0 text-destructive"
        aria-label={t("messages.prioHigh")}
      />
    );
  }
  if (prio === "low") {
    return (
      <ArrowDown
        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-label={t("messages.prioLow")}
      />
    );
  }
  return null;
}

function firstBodyLine(body: string | null): string {
  if (!body) return "";
  return body.split("\n").find((line) => line.trim().length > 0)?.trim() ?? "";
}

export function MessagesList({
  messages,
  selectedId,
  onSelect,
  isLoading,
}: {
  messages: MessageListItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const senderLabel = useSenderLabel();

  if (isLoading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        {t("messages.empty")}
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {messages.map((message) => {
        const label = senderLabel(message);
        const unread = message.status === "new";
        const selected = message.id === selectedId;
        return (
          <li key={message.id}>
            <button
              type="button"
              onClick={() => onSelect(message.id)}
              className={cn(
                "flex w-full gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                selected && "bg-accent",
              )}
            >
              <MessageAvatar message={message} label={label} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      unread ? "font-bold" : "font-normal",
                    )}
                  >
                    {label}
                  </span>
                  <PrioIcon prio={message.prio} />
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {formatMessageTime(message.sent_at)}
                  </span>
                </div>
                <div
                  className={cn(
                    "truncate text-sm",
                    unread ? "font-bold" : "font-normal",
                  )}
                >
                  {message.subject ?? ""}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {firstBodyLine(message.body)}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
