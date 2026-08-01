import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import { GripVertical, Instagram, User, Youtube } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TikTokIcon } from "@/components/app/CreatorsTable";
import {
  FOLLOWER_PLACEHOLDER,
  formatChf,
  formatNumberCh,
  type CurationCollab,
} from "@/lib/campaign-curation";
import { cn } from "@/lib/utils";

function SocialStat({
  url,
  Icon,
  label,
}: {
  url: string | null;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {formatNumberCh(FOLLOWER_PLACEHOLDER)}
    </a>
  );
}

export function CreatorMiniCardBody({
  collab,
  dragHandle,
}: {
  collab: CurationCollab;
  dragHandle?: React.ReactNode;
}) {
  const c = collab.creator;
  const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ");
  return (
    <div className="flex gap-3 p-3">
      {dragHandle}
      <div className="flex w-12 shrink-0 flex-col items-center gap-1">
        <Avatar className="h-12 w-12">
          {c.foto_url ? <AvatarImage src={c.foto_url} alt="" /> : null}
          <AvatarFallback>
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        {matchLabel ? (
          <Badge
            variant="secondary"
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
          <span className="ml-auto shrink-0 text-sm tabular-nums">
            {formatChf(collab.price)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SocialStat url={c.insta_url} Icon={Instagram} label="Instagram" />
          <SocialStat url={c.tiktok_url} Icon={TikTokIcon} label="TikTok" />
          <SocialStat url={c.youtube_url} Icon={Youtube} label="YouTube" />
        </div>
        {collab.pitch ? (
          <p className="line-clamp-3 text-xs text-muted-foreground">{collab.pitch}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CreatorMiniCard({
  collab,
  containerId,
  onOpen,
}: {
  collab: CurationCollab;
  containerId: string;
  onOpen: (collab: CurationCollab) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: collab.id, data: { containerId } });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={() => onOpen(collab)}
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        isDragging && "opacity-50",
      )}
    >
      <CreatorMiniCardBody
        collab={collab}
        dragHandle={
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title={t("campaigns.curate.dragHandle")}
            aria-label={t("campaigns.curate.dragHandle")}
            className="-ml-1 flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
    </Card>
  );
}
