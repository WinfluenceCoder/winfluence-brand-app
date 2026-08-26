import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Heart,
  ImageOff,
  Instagram,
  Linkedin,
  MessageCircle,
  Share2,
  Star,
  User,
  Youtube,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { creatorStatusLabel, TikTokIcon } from "@/components/app/CreatorsTable";
import {
  formatChf,
  formatMatchPercent,
  formatNumberCh,
  matchBadgeClasses,
} from "@/lib/campaign-curation";
import { effectiveCpe } from "@/lib/campaign-monitoring";
import {
  collabStatus,
  showContact,
  type CollabDialogData,
} from "@/lib/collab-dialog";
import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("de-CH", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatDate(value: string | null | undefined) {
  if (!value) return "–";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "–" : dateFmt.format(d);
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm">{value ?? "–"}</div>
    </div>
  );
}

function SocialStat({
  url,
  Icon,
  label,
  value,
  rate,
  hideValue,
}: {
  url: string | null;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number | null;
  rate?: number | null;
  hideValue?: boolean;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {hideValue ? null : value == null ? (
        <span className="text-muted-foreground/60">–</span>
      ) : (
        <span className="tabular-nums">
          {formatNumberCh(value)}
          {rate != null ? ` (${rate.toFixed(1)}%)` : ""}
        </span>
      )}
    </a>
  );
}

function Metric({
  Icon,
  value,
  label,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  value: number | null | undefined;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-muted-foreground"
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      {value == null ? (
        <span className="text-muted-foreground/60">–</span>
      ) : (
        <span className="tabular-nums">{formatNumberCh(value)}</span>
      )}
    </span>
  );
}

function Section({
  title,
  children,
  collapsible,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
}) {
  const heading = (
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {title}
    </div>
  );

  if (!collapsible) {
    return (
      <div className="space-y-2">
        {heading}
        {children}
      </div>
    );
  }

  return (
    <Collapsible className="space-y-2">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left">
        {heading}
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export function CollabDialog({
  collab,
  open,
  onOpenChange,
  actions,
}: {
  collab: CollabDialogData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optionaler Slot für kontextspezifische Buttons in der Fusszeile. */
  actions?: ReactNode;
}) {
  const { t } = useTranslation();
  const [fullCaption, setFullCaption] = useState(false);

  const creator = collab?.creator ?? null;
  const status = collab ? collabStatus(collab) : "applied";
  const name = creator?.nick_name ?? "";
  const fullName = creator
    ? [creator.first_name, creator.last_name].filter(Boolean).join(" ")
    : "";
  const address = creator
    ? [
        [creator.address_street, creator.address_nr].filter(Boolean).join(" "),
        [creator.address_zip, creator.address_city].filter(Boolean).join(" "),
      ]
        .filter((s) => s !== "")
        .join(", ")
    : "";
  const match = formatMatchPercent(collab?.match);
  const rating = collab?.brand_rating ?? null;
  const content = collab?.content ?? null;
  const isDelivered = status === "delivered" || status === "approved";

  const application = collab ? (
    <div className="space-y-2">
      {collab.pitch ? (
        <p className="whitespace-pre-wrap text-sm">{collab.pitch}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          {t("collabDialog.noPitch")}
        </p>
      )}
      {collab.creator_remark ? (
        <Field
          label={t("collabDialog.creatorRemark")}
          value={
            <span className="whitespace-pre-wrap">{collab.creator_remark}</span>
          }
        />
      ) : null}
      {status === "selected" && collab.rank != null ? (
        <Field label={t("collabDialog.rank")} value={`#${collab.rank}`} />
      ) : null}
    </div>
  ) : null;

  const contact = creator ? (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={t("creatorsList.detail.name")} value={fullName || "–"} />
      <Field
        label={t("creatorsList.columns.email")}
        value={
          creator.e_mail_address ? (
            <a
              className="text-primary underline-offset-4 hover:underline"
              href={`mailto:${creator.e_mail_address}`}
            >
              {creator.e_mail_address}
            </a>
          ) : (
            "–"
          )
        }
      />
      <Field
        label={t("creatorsList.columns.mobile")}
        value={
          creator.mobile ? (
            <a
              className="text-primary underline-offset-4 hover:underline"
              href={`tel:${creator.mobile.replace(/\s/g, "")}`}
            >
              {creator.mobile}
            </a>
          ) : (
            "–"
          )
        }
      />
      <Field label={t("creatorsList.detail.address")} value={address || "–"} />
      <Field
        label={t("creatorsList.detail.company")}
        value={creator.company_legal_name || "–"}
      />
    </div>
  ) : null;

  const delivery = collab ? (
    <div className="space-y-3">
      {collab.delivery_note ? (
        <p className="whitespace-pre-wrap text-sm">{collab.delivery_note}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          {t("collabDialog.noDeliveryNote")}
        </p>
      )}

      {content ? (
        <div className="grid grid-cols-[96px_1fr] gap-3 rounded-lg border p-3">
          <div className="h-24 w-24 overflow-hidden rounded-md bg-muted">
            {content.image_url ? (
              <img
                src={content.image_url}
                alt=""
                className="h-24 w-24 rounded-md object-cover"
              />
            ) : content.video_url ? (
              <video
                src={content.video_url}
                muted
                playsInline
                preload="metadata"
                className="h-24 w-24 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center">
                <ImageOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {[content.platform, content.content_type]
                  .filter(Boolean)
                  .join(" · ") || "–"}
              </span>
              {content.platform_link ? (
                <a
                  href={content.platform_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("campaigns.monitor.openContent")}
                  title={t("campaigns.monitor.openContent")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            {content.caption ? (
              <p
                onClick={() => setFullCaption((v) => !v)}
                className={cn(
                  "cursor-pointer whitespace-pre-wrap text-sm",
                  fullCaption ? "" : "line-clamp-3",
                )}
              >
                {content.caption}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Metric Icon={Eye} value={content.reach} label="Reach" />
              <Metric Icon={Heart} value={content.likes} label="Likes" />
              <Metric
                Icon={MessageCircle}
                value={content.comments}
                label="Comments"
              />
              <Metric Icon={Share2} value={content.shares} label="Shares" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {t("collabDialog.uploadedAt")}: {formatDate(content.uploaded_at)}
              </span>
              <span className="text-xs font-semibold tabular-nums">
                eCPE: {formatChf(effectiveCpe({ ...collab, content } as never)) || "–"}
              </span>
            </div>
          </div>
        </div>
      ) : isDelivered ? (
        <p className="text-sm text-muted-foreground">
          {t("collabDialog.noContentLinked")}
        </p>
      ) : null}
    </div>
  ) : null;

  const ratingSection =
    rating != null ? (
      <div className="space-y-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={cn(
                "h-4 w-4",
                i <= rating
                  ? "fill-current text-foreground"
                  : "text-muted-foreground/40",
              )}
            />
          ))}
        </div>
        {collab?.brand_feedback ? (
          <p className="whitespace-pre-wrap text-sm">{collab.brand_feedback}</p>
        ) : null}
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("collabDialog.title", { name })}</DialogTitle>
        </DialogHeader>

        {collab && creator ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar className="h-16 w-16">
                  {creator.foto_url ? (
                    <AvatarImage src={creator.foto_url} alt="" />
                  ) : null}
                  <AvatarFallback>
                    <User className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold tracking-tight">
                      {creator.nick_name || fullName || "–"}
                    </span>
                    <Badge
                      variant={isDelivered ? "outline" : "secondary"}
                      className={cn(
                        isDelivered && "bg-foreground text-background",
                      )}
                    >
                      {creatorStatusLabel(t, collab.status)}
                    </Badge>
                    {match ? (
                      <Badge className={matchBadgeClasses(collab.match)}>
                        {match}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <SocialStat
                      url={creator.insta_url}
                      Icon={Instagram}
                      label="Instagram"
                      value={creator.instagram_followers}
                      rate={creator.instagram_engagement_rate}
                    />
                    <SocialStat
                      url={creator.tiktok_url}
                      Icon={TikTokIcon}
                      label="TikTok"
                      value={creator.tiktok_followers}
                    />
                    <SocialStat
                      url={creator.youtube_url}
                      Icon={Youtube}
                      label="YouTube"
                      value={creator.youtube_subscribers}
                    />
                    <SocialStat
                      url={creator.linkedin_url}
                      Icon={Linkedin}
                      label="LinkedIn"
                      hideValue
                    />
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xl font-semibold tabular-nums">
                  {formatChf(collab.price)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("creatorCard.offer")}:{" "}
                  {[collab.platform, collab.post_type]
                    .filter(Boolean)
                    .join(" · ") || "–"}
                </div>
              </div>
            </div>

            {status === "delivered" || status === "approved" ? (
              <>
                {ratingSection ? (
                  <Section title={t("collabDialog.rating")}>
                    {ratingSection}
                  </Section>
                ) : null}
                <Section title={t("collabDialog.delivery")}>{delivery}</Section>
                <Section title={t("collabDialog.application")} collapsible>
                  {application}
                </Section>
                {showContact(collab) ? (
                  <Section title={t("creatorsList.detail.contact")} collapsible>
                    {contact}
                  </Section>
                ) : null}
              </>
            ) : (
              <>
                <Section title={t("collabDialog.application")}>
                  {application}
                </Section>
                {status === "hired" ? (
                  <Hint text={t("collabDialog.confirmationPending")} />
                ) : null}
                {status === "working" ? (
                  <Hint text={t("collabDialog.deliveryPending")} />
                ) : null}
                {showContact(collab) ? (
                  <Section title={t("creatorsList.detail.contact")} collapsible>
                    {contact}
                  </Section>
                ) : null}
              </>
            )}

            <Separator />
            <div className="flex justify-end gap-2">
              {actions ?? (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.close")}
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
