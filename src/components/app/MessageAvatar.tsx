import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import systemIcon from "@/assets/message-system.png";
import moderatorIcon from "@/assets/message-moderator.png";
import type { MessageListItem } from "@/lib/messages";
import { cn } from "@/lib/utils";

export function useSenderLabel() {
  const { t } = useTranslation();
  return (message: MessageListItem) => {
    if (message.type === "system") return t("messages.senderSystem");
    if (message.type === "moderator") return t("messages.senderTeam");
    return message.sender?.name ?? t("messages.senderUnknown");
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MessageAvatar({
  message,
  label,
  className,
}: {
  message: MessageListItem;
  label: string;
  className?: string;
}) {
  if (message.type === "system" || message.type === "moderator") {
    return (
      <img
        src={message.type === "system" ? systemIcon : moderatorIcon}
        alt={label}
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <Avatar className={cn("h-9 w-9 shrink-0", className)}>
      {message.sender?.photoUrl ? (
        <AvatarImage src={message.sender.photoUrl} alt={label} />
      ) : null}
      <AvatarFallback className="text-xs">{initials(label) || "?"}</AvatarFallback>
    </Avatar>
  );
}
