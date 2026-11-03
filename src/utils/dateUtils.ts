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
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns the Monday-anchored dates for a given week offset from the reference week.
 * Reference week starts Monday, April 20 / 21, 2026.
 */
export function getWeekDates(weekOffset: number = 0): {
  weekId: string;
  startDate: Date;
  endDate: Date;
  dayDates: { dayName: string; dateStr: string; fullDate: string; dayIndex: number }[];
} {
  // Base Monday: April 21, 2026 as shown in the reference design
  const baseMonday = new Date(2026, 3, 21); // Month is 0-indexed: 3 = April
  const monday = new Date(baseMonday);
  monday.setDate(baseMonday.getDate() + weekOffset * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const dayDates = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const dayName = DAY_NAMES[i];
    const dateStr = `${MONTH_NAMES[cur.getMonth()]} ${cur.getDate()}`;
    const fullDate = cur.toISOString().split('T')[0];
    dayDates.push({ dayName, dateStr, fullDate, dayIndex: i });
  }

  const weekId = `week-${monday.getFullYear()}-${(monday.getMonth() + 1).toString().padStart(2, '0')}-${monday.getDate().toString().padStart(2, '0')}`;

  return {
    weekId,
    startDate: monday,
    endDate: sunday,
    dayDates,
  };
}

export function formatWeekSelectorLabel(weekOffset: number): string {
  if (weekOffset === 0) return 'This Week';
  if (weekOffset === 1) return 'Next Week';
  if (weekOffset === -1) return 'Last Week';
  const { dayDates } = getWeekDates(weekOffset);
  return `${dayDates[0].dateStr} – ${dayDates[6].dateStr}`;
}
