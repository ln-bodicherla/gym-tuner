
import { toZonedTime, format } from 'date-fns-tz';

// PST timezone constant
export const PST_TIMEZONE = 'America/Los_Angeles';

// Get current date in PST timezone as YYYY-MM-DD string
export const getCurrentDatePST = (): string => {
  const now = new Date();
  const pstDate = toZonedTime(now, PST_TIMEZONE);
  return format(pstDate, 'yyyy-MM-dd');
};

// Get current date and time in PST timezone
export const getCurrentDateTimePST = (): Date => {
  const now = new Date();
  return toZonedTime(now, PST_TIMEZONE);
};

// Convert a date to PST timezone
export const toPSTDate = (date: Date): Date => {
  return toZonedTime(date, PST_TIMEZONE);
};

// Format date in PST timezone
export const formatPSTDate = (date: Date, formatString: string = 'yyyy-MM-dd'): string => {
  const pstDate = toZonedTime(date, PST_TIMEZONE);
  return format(pstDate, formatString);
};

// Get start of week in PST (Sunday)
export const getStartOfWeekPST = (): string => {
  const now = new Date();
  const pstDate = toZonedTime(now, PST_TIMEZONE);
  const startOfWeek = new Date(pstDate);
  startOfWeek.setDate(pstDate.getDate() - pstDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return format(startOfWeek, 'yyyy-MM-dd');
};

// Get current time in PST as HH:mm string
export const getCurrentTimePST = (): string => {
  const now = new Date();
  const pstDate = toZonedTime(now, PST_TIMEZONE);
  return format(pstDate, 'HH:mm');
};
