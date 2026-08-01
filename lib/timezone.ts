/**
 * Utilities for Asia/Kolkata timezone handling
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns current date string (YYYY-MM-DD) in Asia/Kolkata timezone
 */
export function getISTDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // Returns YYYY-MM-DD
}

/**
 * Returns Day of week in IST: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export function getISTDayOfWeek(dateString: string): number {
  // Parsing dateString in YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  // Create Date object at 06:30:00 UTC (12:00 PM IST on target date)
  const date = new Date(Date.UTC(year, month - 1, day, 6, 30, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
  });
  const weekdayStr = formatter.format(date);
  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return days[weekdayStr] ?? new Date(dateString).getDay();
}

/**
 * Check if a date (YYYY-MM-DD) is a weekday (Monday - Friday) in IST
 */
export function isWeekdayIST(dateString: string): boolean {
  const day = getISTDayOfWeek(dateString);
  return day >= 1 && day <= 5;
}

/**
 * Converts HH:mm (24hr or 12hr with AM/PM) into total minutes from midnight (0..1439)
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const trimmed = timeStr.trim().toUpperCase();

  // Check for AM/PM format
  const isPM = trimmed.includes('PM');
  const isAM = trimmed.includes('AM');
  const cleanStr = trimmed.replace(/(AM|PM)/g, '').trim();
  
  const parts = cleanStr.split(':');
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}
