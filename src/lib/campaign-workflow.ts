import {
  Activity,
  Archive,
  BarChart3,
  CalendarPlus,
  CheckCircle2,
  Eye,
  ListChecks,
  Pencil,
  Play,
  RotateCcw,
  Send,
  Square,
  Star,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { CampaignStatus } from "@/lib/campaigns-list";

/**
 * Single source of truth for the campaign workflow.
 * See `docs/campaign-workflow.md` — keep it in sync with any change here.
 */

export type WorkflowActionKey =
  | "edit"
  | "preview"
  | "publish"
  | "delete"
  | "start"
  | "end"
  | "extend"
  | "approve"
  | "archive"
  | "restart"
  | "curate"
  | "revoke"
  | "monitor"
  | "rate"
  | "stats";

export type WorkflowRoute =
  | { to: "/campaigns/$id/edit" }
  | { to: "/campaigns/publish/$id" }
  | { to: "/campaigns/preview/$id" }
  | { to: "/campaigns/start/$id" }
  | { to: "/campaigns/end/$id" }
  | { to: "/campaigns/extend/$id" }
  | { to: "/campaigns/approve/$id" }
  | { to: "/campaigns/archive/$id" }
  | { to: "/campaigns/re-start/$id" }
  | { to: "/campaigns/curate/$id" }
  | { to: "/campaigns/revoke/$id" }
  | { to: "/campaigns/monitor/$id" }
  | { to: "/campaigns/rate/$id" }
  | { to: "/campaigns/stats/$id" };

export type WorkflowAction = {
  key: WorkflowActionKey;
  labelKey: string; // i18n key under campaignsList.actions
  icon: LucideIcon;
  route: WorkflowRoute;
  openInNewTab?: boolean;
  destructive?: boolean;
};

const ACTIONS: Record<WorkflowActionKey, WorkflowAction> = {
  edit: {
    key: "edit",
    labelKey: "campaignsList.actions.edit",
    icon: Pencil,
    route: { to: "/campaigns/$id/edit" },
  },
  preview: {
    key: "preview",
    labelKey: "campaignsList.actions.preview",
    icon: Eye,
    route: { to: "/campaigns/preview/$id" },
    openInNewTab: true,
  },
  publish: {
    key: "publish",
    labelKey: "campaignsList.actions.publish",
    icon: Send,
    route: { to: "/campaigns/publish/$id" },
  },
  delete: {
    key: "delete",
    labelKey: "campaignsList.actions.delete",
    icon: Trash2,
    route: { to: "/campaigns/$id/edit" }, // handled via delete flow, not navigation
    destructive: true,
  },
  start: {
    key: "start",
    labelKey: "campaignsList.actions.start",
    icon: Play,
    route: { to: "/campaigns/start/$id" },
  },
  end: {
    key: "end",
    labelKey: "campaignsList.actions.end",
    icon: Square,
    route: { to: "/campaigns/end/$id" },
  },
  extend: {
    key: "extend",
    labelKey: "campaignsList.actions.extend",
    icon: CalendarPlus,
    route: { to: "/campaigns/extend/$id" },
  },
  approve: {
    key: "approve",
    labelKey: "campaignsList.actions.approve",
    icon: CheckCircle2,
    route: { to: "/campaigns/approve/$id" },
  },
  archive: {
    key: "archive",
    labelKey: "campaignsList.actions.archive",
    icon: Archive,
    route: { to: "/campaigns/archive/$id" },
  },
  restart: {
    key: "restart",
    labelKey: "campaignsList.actions.restart",
    icon: RotateCcw,
    route: { to: "/campaigns/re-start/$id" },
  },
  curate: {
    key: "curate",
    labelKey: "campaignsList.actions.curate",
    icon: ListChecks,
    route: { to: "/campaigns/curate/$id" },
  },
  revoke: {
    key: "revoke",
    labelKey: "campaignsList.actions.revoke",
    icon: Undo2,
    route: { to: "/campaigns/revoke/$id" },
  },
  monitor: {
    key: "monitor",
    labelKey: "campaignsList.actions.monitor",
    icon: Activity,
    route: { to: "/campaigns/monitor/$id" },
  },
  rate: {
    key: "rate",
    labelKey: "campaignsList.actions.rate",
    icon: Star,
    route: { to: "/campaigns/rate/$id" },
  },
  stats: {
    key: "stats",
    labelKey: "campaignsList.actions.stats",
    icon: BarChart3,
    route: { to: "/campaigns/stats/$id" },
  },
};

export type CampaignWorkflow = {
  rowClick: WorkflowRoute;
  nextStep: WorkflowAction | null;
  menu: WorkflowAction[];
};

const DRAFT: CampaignWorkflow = {
  rowClick: { to: "/campaigns/$id/edit" },
  nextStep: ACTIONS.publish,
  menu: [ACTIONS.edit, ACTIONS.preview, ACTIONS.publish, ACTIONS.delete],
};

const PUBLISHED: CampaignWorkflow = {
  rowClick: { to: "/campaigns/curate/$id" },
  nextStep: ACTIONS.start,
  menu: [ACTIONS.edit, ACTIONS.curate, ACTIONS.revoke, ACTIONS.start],
};

const RUNNING: CampaignWorkflow = {
  rowClick: { to: "/campaigns/monitor/$id" },
  nextStep: ACTIONS.end,
  menu: [ACTIONS.monitor, ACTIONS.rate, ACTIONS.end],
};

const EXPIRED: CampaignWorkflow = {
  rowClick: { to: "/campaigns/monitor/$id" },
  nextStep: ACTIONS.extend,
  menu: [ACTIONS.monitor, ACTIONS.rate, ACTIONS.end],
};

const ENDED: CampaignWorkflow = {
  rowClick: { to: "/campaigns/rate/$id" },
  nextStep: ACTIONS.approve,
  menu: [ACTIONS.monitor, ACTIONS.rate, ACTIONS.approve],
};

const APPROVED: CampaignWorkflow = {
  rowClick: { to: "/campaigns/stats/$id" },
  nextStep: ACTIONS.archive,
  menu: [ACTIONS.stats, ACTIONS.archive],
};

const ARCHIVED: CampaignWorkflow = {
  rowClick: { to: "/campaigns/stats/$id" },
  nextStep: ACTIONS.restart,
  menu: [ACTIONS.stats, ACTIONS.restart],
};

const WORKFLOW: Record<CampaignStatus, CampaignWorkflow> = {
  draft: DRAFT,
  published: PUBLISHED,
  running: RUNNING,
  expired: EXPIRED,
  ended: ENDED,
  approved: APPROVED,
  archived: ARCHIVED,
};

export function getCampaignWorkflow(status: string | null): CampaignWorkflow {
  if (status && status in WORKFLOW) {
    return WORKFLOW[status as CampaignStatus];
  }
  return DRAFT;
}
