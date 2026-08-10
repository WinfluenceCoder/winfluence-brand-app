import { useTranslation } from "react-i18next";
import { MailOpen, RefreshCw, Trash2, ArrowLeft, ArrowDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MessageAvatar, useSenderLabel } from "@/components/app/MessageAvatar";
import type { MessageListItem } from "@/lib/messages";

export function MessageReader({
  message,
  onMarkUnread,
  onDelete,
  onRefresh,
  onBack,
  busy,
}: {
  message: MessageListItem;
  onMarkUnread: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onBack?: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const senderLabel = useSenderLabel();
  const label = senderLabel(message);
  const sentAt = message.sent_at ? new Date(message.sent_at) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("messages.back")}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onMarkUnread} disabled={busy}>
          <MailOpen className="mr-1 h-4 w-4" />
          {t("messages.markUnread")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={busy}>
              <Trash2 className="mr-1 h-4 w-4" />
              {t("messages.delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("messages.delete")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("messages.deleteConfirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                {t("messages.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={busy}
          className="ml-auto"
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          {t("messages.refresh")}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-start gap-3">
          <MessageAvatar message={message} label={label} className="h-11 w-11" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {message.subject ?? ""}
              </h2>
              {message.prio === "high" && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {t("messages.prioHigh")}
                </span>
              )}
              {message.prio === "low" && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowDown className="h-3.5 w-3.5" />
                  {t("messages.prioLow")}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {sentAt && (
              <p className="text-xs text-muted-foreground">
                {sentAt.toLocaleString("de-CH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed">
          {message.body ?? ""}
        </div>
      </div>
    </div>
  );
}
