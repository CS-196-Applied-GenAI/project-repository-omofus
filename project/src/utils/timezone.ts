/**
 * Get the current date in a specific timezone
 * @param timezoneOffset - hours offset from UTC (e.g., -8 for PST, 5.5 for IST)
 * @returns Date object representing the current date in that timezone
 */
export function getDateInTimezone(timezoneOffset: number): Date {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const timeInTimezone = new Date(utcTime + timezoneOffset * 3600000);
  return new Date(timeInTimezone.getFullYear(), timeInTimezone.getMonth(), timeInTimezone.getDate());
}

/**
 * Get the current date in UTC
 */
export function getDateUTC(): Date {
  const now = new Date();
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse timezone offset string (e.g., "+05:30", "-08:00")
 */
export function parseTimezoneOffset(offset: string): number {
  const match = offset.match(/([+-])(\d{1,2}):?(\d{2})?/);
  if (!match) return 0;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2]);
  const minutes = match[3] ? parseInt(match[3]) : 0;

  return sign * (hours + minutes / 60);
}

/**
 * Check if two dates represent the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
