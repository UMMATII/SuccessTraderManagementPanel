import { format, parse, isValid } from 'date-fns';

export function calculateDurationInMinutes(timeFrom: string, timeTo: string): number {
  if (!timeFrom || !timeTo) return 0;
  
  // Format could be "HH:mm" or "HH:mm:ss"
  const [h1, m1] = timeFrom.split(':').map(Number);
  const [h2, m2] = timeTo.split(':').map(Number);
  
  const fromMinutes = h1 * 60 + m1;
  const toMinutes = h2 * 60 + m2;
  
  return Math.max(0, toMinutes - fromMinutes);
}

export function formatMinutesToHours(minutes: number): string {
  if (!minutes || isNaN(minutes) || minutes <= 0) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatMinutesToDecimalHours(minutes: number): number {
  if (!minutes || isNaN(minutes)) return 0;
  return Number((minutes / 60).toFixed(1));
}

export function getCurrentDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(dateString: string | null | undefined, pattern = 'MMM dd, yyyy'): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (!isValid(d)) return dateString;
    return format(d, pattern);
  } catch {
    return dateString;
  }
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '--:--';
  // If format is HH:mm:ss, return HH:mm
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

export function getMonthYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
  return { years, months };
}
