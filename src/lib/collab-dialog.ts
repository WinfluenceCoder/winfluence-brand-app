import type { CurationCollab } from "@/lib/campaign-curation";
import type { DeliveredContent } from "@/lib/campaign-monitoring";

/** Gemeinsamer Datenvertrag für CollabDialog. Delivery-/Rating-Felder sind optional,
 *  damit sowohl Curation- als auch Monitoring-Loader den Typ erfüllen. */
export type CollabApproval = "rejected" | "approved" | "expectations_exceeded";

export type CollabDialogData = CurationCollab & {
  approval?: CollabApproval | null;
  delivery_note?: string | null;
  content?: DeliveredContent | null;
  brand_rating?: number | null;
  brand_feedback?: string | null;
  creator_remark?: string | null;
};

export const COLLAB_STATUSES = [
  "applied",
  "selected",
  "hired",
  "working",
  "delivered",
  "approved",
  "rejected",
] as const;
export type CollabStatus = (typeof COLLAB_STATUSES)[number];

/** Unbekannte/NULL-Status werden wie "applied" behandelt. */
export function collabStatus(c: CollabDialogData): CollabStatus {
  return (COLLAB_STATUSES as readonly string[]).includes(c.status ?? "")
    ? (c.status as CollabStatus)
    : "applied";
}

/** Kontaktdaten erst ab hired sichtbar (Brand hat dann eine Geschäftsbeziehung). */
export function showContact(c: CollabDialogData): boolean {
  const s = collabStatus(c);
  return s !== "applied" && s !== "selected";
}
