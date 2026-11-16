export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats a Date in local calendar time as YYYY-MM-DD (avoids UTC day-shift bugs).
 */
export function formatLocalISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the Monday (00:00 local time) of the calendar week containing `referenceDate`.
 */
export function getMondayOfWeek(referenceDate: Date = new Date()): Date {
  const normalized = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const dayOfWeek = normalized.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return new Date(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate() + diffToMonday
  );
}

/**
 * Returns 0 for Monday through 6 for Sunday for the given local date.
 */
export function getCurrentDayIndex(referenceDate: Date = new Date()): number {
  const dayOfWeek = referenceDate.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

/**
 * Returns the Monday-through-Sunday dates for a given week offset from the current calendar week.
 * Week 0 is always the active Monday–Sunday week containing `referenceDate`.
 */
export function getWeekDates(
  weekOffset: number = 0,
  referenceDate: Date = new Date()
): {
  weekId: string;
  startDate: Date;
  endDate: Date;
  dayDates: { dayName: string; dateStr: string; fullDate: string; dayIndex: number }[];
} {
  const currentMonday = getMondayOfWeek(referenceDate);
  const monday = new Date(
    currentMonday.getFullYear(),
    currentMonday.getMonth(),
    currentMonday.getDate() + weekOffset * 7
  );

  const sunday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6,
    23,
    59,
    59,
    999
  );

  const dayDates = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dayName = DAY_NAMES[i];
    const dateStr = `${MONTH_NAMES[cur.getMonth()]} ${cur.getDate()}`;
    const fullDate = formatLocalISODate(cur);
    dayDates.push({ dayName, dateStr, fullDate, dayIndex: i });
  }

  const weekId = `week-${formatLocalISODate(monday)}`;

  return {
    weekId,
    startDate: monday,
    endDate: sunday,
    dayDates,
  };
}

export function formatWeekRangeLabel(
  weekOffset: number = 0,
  referenceDate: Date = new Date()
): string {
  const { startDate, endDate, dayDates } = getWeekDates(weekOffset, referenceDate);
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  if (sameYear) {
    return `${dayDates[0].dateStr} – ${dayDates[6].dateStr}, ${endDate.getFullYear()}`;
  }
  return `${dayDates[0].dateStr}, ${startDate.getFullYear()} – ${dayDates[6].dateStr}, ${endDate.getFullYear()}`;
}

export function formatWeekSelectorLabel(
  weekOffset: number,
  referenceDate: Date = new Date()
): string {
  if (weekOffset === 0) return 'This Week';
  if (weekOffset === 1) return 'Next Week';
  if (weekOffset === -1) return 'Last Week';
  const { dayDates } = getWeekDates(weekOffset, referenceDate);
  return `${dayDates[0].dateStr} – ${dayDates[6].dateStr}`;
}

/**
 * Returns milliseconds remaining until the next Monday 00:00:01 local time.
 */
export function msUntilNextMonday(referenceDate: Date = new Date()): number {
  const currentMonday = getMondayOfWeek(referenceDate);
  const nextMonday = new Date(
    currentMonday.getFullYear(),
    currentMonday.getMonth(),
    currentMonday.getDate() + 7,
    0,
    0,
    1
  );
  return Math.max(1000, nextMonday.getTime() - referenceDate.getTime());
}
