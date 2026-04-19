import type { ClassSchedule } from '../types';

const WEEKDAY_FROM_JS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(yyyyMmDd: string): Date {
  const [y, mo, da] = yyyyMmDd.split('-').map(Number);
  if (!y || !mo || !da) return new Date(NaN);
  return new Date(y, mo - 1, da);
}

export function weekdayKeyForDate(d: Date): string {
  return WEEKDAY_FROM_JS[d.getDay()];
}

/** Schedule applies to this calendar date (inclusive range + weekday). */
export function isScheduleActiveOnDate(schedule: ClassSchedule, dateYmd: string): boolean {
  const day = parseLocalDate(dateYmd);
  if (Number.isNaN(day.getTime())) return false;
  const start = parseLocalDate(schedule.startDate);
  const end = parseLocalDate(schedule.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  const t = new Date(day);
  t.setHours(0, 0, 0, 0);
  const s0 = new Date(start);
  s0.setHours(0, 0, 0, 0);
  const e0 = new Date(end);
  e0.setHours(0, 0, 0, 0);
  if (t < s0 || t > e0) return false;
  const key = weekdayKeyForDate(day);
  return schedule.daysOfWeek.some((d) => d.trim() === key);
}

export function activeClassIdsForDate(schedules: ClassSchedule[], dateYmd: string): Set<string> {
  const ids = new Set<string>();
  for (const sch of schedules) {
    if (isScheduleActiveOnDate(sch, dateYmd)) ids.add(sch.classId);
  }
  return ids;
}
