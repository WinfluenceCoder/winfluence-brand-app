import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { creatorStatusLabel } from "@/components/app/CreatorsTable";
import {
  formatChf,
  formatMatchPercent,
  matchBadgeClasses,
} from "@/lib/campaign-curation";
import type { MonitoringCollab } from "@/lib/campaign-monitoring";
import { cn } from "@/lib/utils";

function statusVariant(
  s: string | null,
): "default" | "secondary" | "outline" | "hired" | "working" {
  switch (s) {
    case "hired":
      return "hired";
    case "working":
      return "working";
    case "delivered":
      return "outline";
    default:
      return "secondary";
  }
}

export function MonitoringCreatorCard({
  collab,
  onOpen,
}: {
  collab: MonitoringCollab;
  onOpen: (collab: MonitoringCollab) => void;
}) {
  const { t } = useTranslation();
  const c = collab.creator;
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
  const matchLabel = formatMatchPercent(collab.match);

  return (
    <Card
      onClick={() => onOpen(collab)}
      className="cursor-pointer transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3 p-3">
        <div className="flex w-12 shrink-0 flex-col items-center gap-1">
          <Avatar className="h-12 w-12">
            {c.foto_url ? <AvatarImage src={c.foto_url} alt="" /> : null}
            <AvatarFallback>
              <User className="h-5 w-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          {matchLabel ? (
            <Badge
              variant="outline"
              className={cn(
                "border-transparent px-1.5 py-0 text-[10px] font-semibold tabular-nums",
                matchBadgeClasses(collab.match),
              )}
            >
              {matchLabel}
            </Badge>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium">
              {c.nick_name || fullName || "–"}
            </span>
            <Badge variant={statusVariant(collab.status)} className="shrink-0">
              {creatorStatusLabel(t, collab.status)}
            </Badge>
            <span className="ml-auto shrink-0 text-sm tabular-nums">
              {formatChf(collab.price)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {`${collab.platform ?? "–"} · ${collab.post_type ?? "–"}`}
          </p>
          {collab.pitch ? (
            <p className="line-clamp-3 text-xs text-muted-foreground">{collab.pitch}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
