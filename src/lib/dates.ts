import type { ExperienceItem } from '../types';

const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

export interface ParsedDate {
  year: number;
  month: number; // 0-11, defaults to January when only a year is given
}

/** Accepts "2021", "Mar 2021", "March 2021", "03/2021", "2021-03". */
export function parseDate(input: string): ParsedDate | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  if (/^(present|current|now|ongoing)$/.test(text)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  const iso = text.match(/^(\d{4})[-/](\d{1,2})/);
  if (iso) return { year: Number(iso[1]), month: Math.min(11, Math.max(0, Number(iso[2]) - 1)) };

  const slash = text.match(/^(\d{1,2})[-/](\d{4})$/);
  if (slash) return { year: Number(slash[2]), month: Math.min(11, Math.max(0, Number(slash[1]) - 1)) };

  const named = text.match(/([a-z]{3,})\.?\s+(\d{4})/);
  if (named) {
    const index = MONTHS.findIndex((month) => month.startsWith(named[1].slice(0, 3)));
    if (index >= 0) return { year: Number(named[2]), month: index };
  }

  const yearOnly = text.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) return { year: Number(yearOnly[0]), month: 0 };

  return null;
}

function toMonths(date: ParsedDate): number {
  return date.year * 12 + date.month;
}

/**
 * Total professional experience in years, merging overlapping roles so
 * concurrent jobs are not double-counted.
 */
export function yearsOfExperience(experience: ExperienceItem[]): number {
  const now = new Date();
  const nowMonths = now.getFullYear() * 12 + now.getMonth();

  const spans = experience
    .map((role) => {
      const start = parseDate(role.start);
      if (!start) return null;
      const end = role.current ? { year: now.getFullYear(), month: now.getMonth() } : parseDate(role.end);
      const startMonths = toMonths(start);
      const endMonths = Math.min(end ? toMonths(end) : nowMonths, nowMonths);
      if (endMonths < startMonths) return null;
      return [startMonths, endMonths] as const;
    })
    .filter((span): span is readonly [number, number] => span !== null)
    .sort((a, b) => a[0] - b[0]);

  if (!spans.length) return 0;

  let total = 0;
  let [currentStart, currentEnd] = spans[0];
  for (const [start, end] of spans.slice(1)) {
    if (start <= currentEnd) {
      currentEnd = Math.max(currentEnd, end);
    } else {
      total += currentEnd - currentStart;
      currentStart = start;
      currentEnd = end;
    }
  }
  total += currentEnd - currentStart;
  return Math.round((total / 12) * 10) / 10;
}

export function formatRange(start: string, end: string, current: boolean): string {
  const left = start.trim();
  const right = current ? 'Present' : end.trim();
  if (left && right) return `${left} – ${right}`;
  return left || right;
}
