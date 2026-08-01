import type { SVGProps } from "react";
import { useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Instagram,
  Linkedin,
  MessageSquare,
  MoreVertical,
  User,
  Youtube,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLLAB_STATUSES, type CreatorListRow } from "@/lib/creators-list";

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M16.5 3c.3 2 1.5 3.4 3.5 3.7v2.6c-1.3.1-2.6-.3-3.7-1v5.9c0 3.6-2.4 6-5.6 6-3 0-5.2-2.2-5.2-5.2 0-3.1 2.4-5.3 5.6-5.1v2.7c-.3-.1-.7-.2-1.1-.2-1.4 0-2.4 1-2.4 2.5s1 2.5 2.4 2.5c1.5 0 2.6-1.1 2.6-3V3h3.9z" />
    </svg>
  );
}

export function creatorStatusLabel(t: (k: string) => string, s: string | null) {
  switch (s) {
    case "applied":
      return t("creatorsList.status.applied");
    case "selected":
      return t("creatorsList.status.selected");
    case "hired":
      return t("creatorsList.status.hired");
    default:
      return s ?? "–";
  }
}

function statusVariant(s: string | null): "default" | "secondary" | "outline" {
  return s === "hired" ? "default" : "secondary";
}

const FOLLOWERS_PLACEHOLDER = 1234;

function SocialCell({
  url,
  Icon,
  label,
  withFollowers = true,
}: {
  url: string | null;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  withFollowers?: boolean;
}) {
  if (!url) return <span className="text-muted-foreground">–</span>;
  return (
    <div
      className="flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="text-muted-foreground hover:text-foreground"
      >
        <Icon className="h-4 w-4" />
      </a>
      {withFollowers ? (
        <span className="text-sm tabular-nums">
          {FOLLOWERS_PLACEHOLDER.toLocaleString("de-CH")}
        </span>
      ) : null}
    </div>
  );
}

type Props = {
  rows: CreatorListRow[];
  statusFilter?: { value: string; onChange: (v: string) => void };
};

export function CreatorsTable({ rows, statusFilter }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const socialItem = (
    key: string,
    url: string | null,
    Icon: React.ComponentType<{ className?: string }>,
    label: string,
  ) => (
    <DropdownMenuItem key={key} disabled={!url} asChild={!!url}>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Icon className="h-4 w-4" />
          {label}
        </a>
      ) : (
        <span>
          <Icon className="h-4 w-4" />
          {label}
        </span>
      )}
    </DropdownMenuItem>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16"></TableHead>
          <TableHead>{t("creatorsList.columns.nickname")}</TableHead>
          <TableHead>{t("creatorsList.columns.email")}</TableHead>
          <TableHead>{t("creatorsList.columns.mobile")}</TableHead>
          <TableHead>{t("creatorsList.columns.instagram")}</TableHead>
          <TableHead>{t("creatorsList.columns.tiktok")}</TableHead>
          <TableHead>{t("creatorsList.columns.youtube")}</TableHead>
          <TableHead>{t("creatorsList.columns.linkedin")}</TableHead>
          <TableHead className="p-0">
            {statusFilter ? (
              <Select value={statusFilter.value} onValueChange={statusFilter.onChange}>
                <SelectTrigger className="h-auto w-auto gap-1 border-0 bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground shadow-none hover:text-foreground focus:ring-0 focus-visible:ring-0 [&>svg]:opacity-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("creatorsList.filterAll")}</SelectItem>
                  {COLLAB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`creatorsList.status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="px-4">{t("creatorsList.columns.status")}</span>
            )}
          </TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() =>
              router.navigate({
                to: "/influencers/$id",
                params: { id: String(row.id) },
              })
            }
          >
            <TableCell>
              <Avatar className="h-10 w-10">
                {row.foto_url ? <AvatarImage src={row.foto_url} alt="" /> : null}
                <AvatarFallback>
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">
              {row.nick_name ??
                [row.first_name, row.last_name].filter(Boolean).join(" ") ??
                "–"}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              {row.e_mail_address ? (
                <a
                  href={`mailto:${row.e_mail_address}`}
                  className="text-primary hover:underline underline-offset-4"
                >
                  {row.e_mail_address}
                </a>
              ) : (
                "–"
              )}
            </TableCell>
            <TableCell>{row.mobile ?? "–"}</TableCell>
            <TableCell>
              <SocialCell url={row.insta_url} Icon={Instagram} label="Instagram" />
            </TableCell>
            <TableCell>
              <SocialCell url={row.tiktok_url} Icon={TikTokIcon} label="TikTok" />
            </TableCell>
            <TableCell>
              <SocialCell url={row.youtube_url} Icon={Youtube} label="YouTube" />
            </TableCell>
            <TableCell>
              <SocialCell
                url={row.linkedin_url}
                Icon={Linkedin}
                label="LinkedIn"
                withFollowers={false}
              />
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(row.collabStatus)}>
                {creatorStatusLabel(t, row.collabStatus)}
              </Badge>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t("creatorsList.actions.openMenu")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {socialItem("insta", row.insta_url, Instagram, "Instagram")}
                  {socialItem("tiktok", row.tiktok_url, TikTokIcon, "TikTok")}
                  {socialItem("youtube", row.youtube_url, Youtube, "YouTube")}
                  {socialItem("linkedin", row.linkedin_url, Linkedin, "LinkedIn")}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <MessageSquare className="h-4 w-4" />
                    {t("creatorsList.actions.sendMessage")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
