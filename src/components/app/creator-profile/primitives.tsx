import type { ReactNode } from "react";
import { useState } from "react";
import { ImageOff, TrendingDown, TrendingUp, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatExact, formatNumber, formatPercent } from "@/lib/format";
import type { PersonEntry } from "@/lib/creator-stats";

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string | null;
  trend?: "up" | "down" | null;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 text-xl font-semibold tracking-tight",
            trend === "up" && "text-emerald-600",
            trend === "down" && "text-destructive",
          )}
        >
          {trend === "up" ? <TrendingUp className="h-4 w-4" /> : null}
          {trend === "down" ? <TrendingDown className="h-4 w-4" /> : null}
          {value}
        </div>
        {hint ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export type BarItem = { label: string; value: number };

export function BarList({ items }: { items: BarItem[] }) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.value), 0.0001);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-32 shrink-0 truncate text-sm" title={item.label}>
            {item.label}
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <div className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
            {formatPercent(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChipCloud({
  items,
}: {
  items: { label: string; weight: number }[];
}) {
  if (items.length === 0) return null;
  const max = Math.max(...items.map((i) => i.weight), 0.0001);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const ratio = item.weight / max;
        return (
          <span
            key={item.label}
            className={cn(
              "rounded-full border bg-muted/40 px-3 py-1",
              ratio > 0.66 ? "text-base" : ratio > 0.33 ? "text-sm" : "text-xs",
            )}
          >
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

export function FallbackImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function PersonGrid({
  people,
  followersLabel,
}: {
  people: PersonEntry[];
  followersLabel: string;
}) {
  if (people.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((p, i) => (
        <a
          key={`${p.username ?? "person"}-${i}`}
          href={p.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <Avatar className="h-10 w-10">
            {p.picture ? <AvatarImage src={p.picture} alt="" /> : null}
            <AvatarFallback>
              <User className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {p.fullname || p.username || "–"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {formatNumber(p.followers ?? null)} {followersLabel}
              {p.engagementRate != null
                ? ` · ${formatPercent(p.engagementRate)}`
                : ""}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export function KeyValueList({
  entries,
}: {
  entries: { label: string; value: string }[];
}) {
  if (entries.length === 0) return null;
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {entries.map((e) => (
        <div key={e.label} className="flex justify-between gap-3 text-sm">
          <dt className="text-muted-foreground">{e.label}</dt>
          <dd className="truncate">{e.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Gauge({ value, label }: { value: number | null; label: string }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight">
        {value == null ? "–" : formatExact(Math.round(pct))}
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
