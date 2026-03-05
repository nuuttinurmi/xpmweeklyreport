// ============================================================
// Week utilities
// All week numbers are ISO 8601 (Monday = first day of week)
// ============================================================

import type { WeekDay } from "../types/dataverse";

/** Returns ISO week number and year for a given date */
export function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

/** Returns Monday of the given ISO week */
export function getMondayOfISOWeek(week: number, year: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const mondayOffset = dow <= 4 ? 1 - dow : 8 - dow;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() + mondayOffset);
  return monday;
}

/** Returns Friday of the given ISO week */
export function getFridayOfISOWeek(week: number, year: number): Date {
  const monday = getMondayOfISOWeek(week, year);
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  return friday;
}

/** Formats a date as YYYY-MM-DD (UTC) */
export function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Formats a date as "3.3." (Finnish short date) */
export function toFinnishShort(date: Date): string {
  return `${date.getUTCDate()}.${date.getUTCMonth() + 1}.`;
}

const FI_DAYS = ["Ma", "Ti", "Ke", "To", "Pe"];

/**
 * Builds the 15-column (3 weeks × 5 days) header for the schedule grid.
 * Weeks: N-1, N, N+1 relative to reportWeek.
 */
export function buildScheduleColumns(
  reportWeek: number,
  reportYear: number
): { weeks: { week: number; year: number; label: string }[]; days: WeekDay[] } {
  const weeks: { week: number; year: number; label: string }[] = [];
  const days: WeekDay[] = [];

  for (let offset = -1; offset <= 1; offset++) {
    let w = reportWeek + offset;
    let y = reportYear;
    if (w < 1) {
      y -= 1;
      w = getISOWeek(new Date(Date.UTC(y, 11, 31))).week + w;
    } else if (w > 52) {
      const lastWeekOfYear = getISOWeek(new Date(Date.UTC(y, 11, 31))).week;
      if (w > lastWeekOfYear) {
        w = w - lastWeekOfYear;
        y += 1;
      }
    }
    const monday = getMondayOfISOWeek(w, y);
    weeks.push({ week: w, year: y, label: `Vko ${w}` });
    for (let d = 0; d < 5; d++) {
      const day = new Date(monday);
      day.setUTCDate(monday.getUTCDate() + d);
      days.push({
        isoDate: toISODateString(day),
        label: FI_DAYS[d],
        weekNumber: w,
      });
    }
  }

  return { weeks, days };
}

/**
 * For a task with startdate/enddate, returns a boolean[15]
 * indicating which of the 15 days the task is active.
 */
export function buildTaskDayMask(
  startDate: string | undefined,
  endDate: string | undefined,
  days: WeekDay[]
): boolean[] {
  if (!startDate || !endDate) return days.map(() => false);
  const start = startDate.slice(0, 10);
  const end = endDate.slice(0, 10);
  return days.map((d) => d.isoDate >= start && d.isoDate <= end);
}

/** Derives a task "area" from its name or WBS string.
 *  Convention: "Area > Task name" or "Area - Task name".
 *  Falls back to empty string. */
export function deriveArea(taskName: string, wbs?: string): string {
  const separators = [" > ", " - ", ": ", " / "];
  for (const sep of separators) {
    if (taskName.includes(sep)) {
      return taskName.split(sep)[0].trim();
    }
  }
  // Use first WBS level prefix if available, e.g. "1.2.3" → "1"
  if (wbs) {
    const level1 = wbs.split(".")[0];
    if (level1 && level1 !== wbs) return `WBS ${level1}`;
  }
  return "";
}

/** Strips the area prefix from a task name */
export function stripAreaFromName(taskName: string): string {
  const separators = [" > ", " - ", ": ", " / "];
  for (const sep of separators) {
    if (taskName.includes(sep)) {
      return taskName.split(sep).slice(1).join(sep).trim();
    }
  }
  return taskName;
}

/** Calculates completion percentage from Work / Actual work fields */
export function calcCompletion(work?: number, actualWork?: number): number {
  if (!work || work === 0) return 0;
  return Math.min(100, Math.round(((actualWork ?? 0) / work) * 100));
}

/** Returns the next sequential report number string, e.g. "010/2026" */
export function formatReportNumber(sequence: number, year: number): string {
  return `${String(sequence).padStart(3, "0")}/${year}`;
}
