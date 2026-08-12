/** Gemeinsame Zahlen-/Datums-Formatierung (deutsches Format). */
const LOCALE = "de-CH";

/** Zahl im deutschen Format, ab 10'000 kompakt („19,9 k", „1,2 M"). */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "–";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(value / 1_000_000)} M`;
  }
  if (abs >= 10_000) {
    return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(value / 1_000)} k`;
  }
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}

/** Exakte Zahl ohne Kompaktierung (z. B. für Tooltips). */
export function formatExact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "–";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}

/** Prozentwert: 1.7 -> „1,7 %". */
export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value == null || !Number.isFinite(value)) return "–";
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

/**
 * influData liefert Anteile teils als 0.635, teils als 63.5.
 * Werte <= 1 werden als Anteil interpretiert.
 */
export function asPercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.abs(value) <= 1 ? value * 100 : value;
}

const DATE_FMT = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  return DATE_FMT.format(d);
}

/** Relative Angabe („vor 2 Tagen"), Fallback auf absolutes Datum. */
export function formatRelativeDate(value: string | null | undefined): string {
  if (!value) return "–";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "–";
  const diffMs = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 3600_000],
    ["month", 30 * 24 * 3600_000],
    ["day", 24 * 3600_000],
    ["hour", 3600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(0, "minute");
}
