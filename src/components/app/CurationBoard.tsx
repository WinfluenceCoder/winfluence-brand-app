import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorMiniCard, CreatorMiniCardBody } from "@/components/app/CreatorMiniCard";
import { CreatorProfileDialog } from "@/components/app/CreatorProfileDialog";
import { CampaignCalculationCard } from "@/components/app/CampaignCalculationCard";
import {
  loadAppliedOrder,
  saveAppliedOrder,
  saveRanks,
  setCollabStatus,
  type CurationCollab,
} from "@/lib/campaign-curation";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

const LEFT = "selected";
const RIGHT = "applied";

function sortLeft(rows: CurationCollab[]) {
  return [...rows].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
}

function sortRight(rows: CurationCollab[], order: number[]) {
  const byMatch = [...rows].sort((a, b) => (b.match ?? -1) - (a.match ?? -1));
  if (order.length === 0) return byMatch;
  const idx = new Map(order.map((id, i) => [id, i]));
  return byMatch.sort((a, b) => {
    const ai = idx.get(a.id);
    const bi = idx.get(b.id);
    if (ai == null && bi == null) return 0;
    if (ai == null) return 1;
    if (bi == null) return -1;
    return ai - bi;
  });
}

function Column({
  id,
  title,
  emptyText,
  items,
  onOpen,
}: {
  id: string;
  title: string;
  emptyText: string;
  items: CurationCollab[];
  onOpen: (c: CurationCollab) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { containerId: id } });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={setNodeRef}
          className={cn(
            "min-h-40 space-y-3 rounded-md border border-dashed p-2 transition-colors",
            isOver ? "border-primary bg-primary/5" : "border-border",
          )}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((c) => (
              <CreatorMiniCard
                key={c.id}
                collab={c}
                containerId={id}
                onOpen={onOpen}
              />
            ))}
          </SortableContext>
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function CurationBoard({
  campaignId,
  collabs,
  barterValue,
}: {
  campaignId: number;
  collabs: CurationCollab[];
  barterValue: number | null;
}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [left, setLeft] = useState<CurationCollab[]>([]);
  const [right, setRight] = useState<CurationCollab[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [profile, setProfile] = useState<CurationCollab | null>(null);

  const signature = collabs
    .map((c) => `${c.id}:${c.status}:${c.rank ?? ""}:${c.match ?? ""}`)
    .join("|");

  useEffect(() => {
    setLeft(sortLeft(collabs.filter((c) => c.status === "selected")));
    setRight(
      sortRight(
        collabs.filter((c) => c.status === "applied"),
        loadAppliedOrder(campaignId),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, campaignId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCollab = useMemo(
    () => [...left, ...right].find((c) => c.id === activeId) ?? null,
    [activeId, left, right],
  );

  function containerOf(id: number): typeof LEFT | typeof RIGHT | null {
    if (left.some((c) => c.id === id)) return LEFT;
    if (right.some((c) => c.id === id)) return RIGHT;
    return null;
  }

  async function persist(nextLeft: CurationCollab[], moved?: {
    id: number;
    status: "applied" | "selected";
  }) {
    try {
      if (moved) await setCollabStatus(moved.id, moved.status);
      await saveRanks(nextLeft.map((c) => c.id));
      await qc.invalidateQueries({ queryKey: ["campaign-curation", campaignId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("campaigns.curate.saveError"));
      await qc.invalidateQueries({ queryKey: ["campaign-curation", campaignId] });
    }
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdNum = Number(active.id);
    const from = containerOf(activeIdNum);
    if (!from) return;

    const overIdNum = Number(over.id);
    const overContainer =
      (over.data.current?.containerId as string | undefined) ??
      (over.id === LEFT || over.id === RIGHT ? String(over.id) : undefined) ??
      from;

    // Innerhalb derselben Liste sortieren
    if (overContainer === from) {
      if (from === LEFT) {
        const oldIndex = left.findIndex((c) => c.id === activeIdNum);
        const newIndex = left.findIndex((c) => c.id === overIdNum);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
        const next = arrayMove(left, oldIndex, newIndex);
        setLeft(next);
        void persist(next);
      } else {
        const oldIndex = right.findIndex((c) => c.id === activeIdNum);
        const newIndex = right.findIndex((c) => c.id === overIdNum);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
        const next = arrayMove(right, oldIndex, newIndex);
        setRight(next);
        saveAppliedOrder(
          campaignId,
          next.map((c) => c.id),
        );
      }
      return;
    }

    // Zwischen den Listen verschieben
    if (from === RIGHT && overContainer === LEFT) {
      const item = right.find((c) => c.id === activeIdNum);
      if (!item) return;
      const insertAt =
        overIdNum === activeIdNum
          ? left.length
          : (() => {
              const i = left.findIndex((c) => c.id === overIdNum);
              return i < 0 ? left.length : i;
            })();
      const nextLeft = [...left];
      nextLeft.splice(insertAt, 0, { ...item, status: "selected" });
      const nextRight = right.filter((c) => c.id !== activeIdNum);
      setLeft(nextLeft);
      setRight(nextRight);
      saveAppliedOrder(
        campaignId,
        nextRight.map((c) => c.id),
      );
      void persist(nextLeft, { id: activeIdNum, status: "selected" });
      return;
    }

    if (from === LEFT && overContainer === RIGHT) {
      const item = left.find((c) => c.id === activeIdNum);
      if (!item) return;
      const insertAt =
        overIdNum === activeIdNum
          ? right.length
          : (() => {
              const i = right.findIndex((c) => c.id === overIdNum);
              return i < 0 ? right.length : i;
            })();
      const nextRight = [...right];
      nextRight.splice(insertAt, 0, { ...item, status: "applied", rank: null });
      const nextLeft = left.filter((c) => c.id !== activeIdNum);
      setLeft(nextLeft);
      setRight(nextRight);
      saveAppliedOrder(
        campaignId,
        nextRight.map((c) => c.id),
      );
      void persist(nextLeft, { id: activeIdNum, status: "applied" });
    }
  }

  return (
    <>
      <CampaignCalculationCard selected={left} barterValue={barterValue} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Column
            id={LEFT}
            title={t("campaigns.curate.selectedTitle")}
            emptyText={t("campaigns.curate.selectedEmpty")}
            items={left}
            onOpen={setProfile}
          />
          <Column
            id={RIGHT}
            title={t("campaigns.curate.appliedTitle")}
            emptyText={t("campaigns.curate.appliedEmpty")}
            items={right}
            onOpen={setProfile}
          />
        </div>
        <DragOverlay>
          {activeCollab ? (
            <Card className="shadow-lg">
              <CreatorMiniCardBody collab={activeCollab} />
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreatorProfileDialog
        creator={profile?.creator ?? null}
        open={profile != null}
        onOpenChange={(open) => {
          if (!open) setProfile(null);
        }}
      />
    </>
  );
}
