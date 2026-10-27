/**
 * Date utility functions for Bucket workspace
 */

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No target date';
  try {
    const dt = parseYmdDate(dateString);
    if (!dt) return 'No target date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dt);
  } catch {
    return 'No target date';
  }
}

export function formatRelativeOrShortDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const trimmed = dateString.trim();
    if (!trimmed) return '';

    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) {
      // Future timestamp, format as short date
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    }

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

export function isUpcomingDate(targetDate: string | null | undefined): boolean {
  if (!targetDate) return false;
  try {
    const dt = parseYmdDate(targetDate);
    if (!dt) return false;
    const targetTime = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999).getTime();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    return targetTime >= startOfToday;
  } catch {
    return false;
  }
}

export function getDaysRemaining(targetDate: string | null | undefined): string | null {
  if (!targetDate) return null;
  try {
    const dt = parseYmdDate(targetDate);
    if (!dt) return null;
    const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  } catch {
    return null;
  }
}

/**
 * Formats a Date object to YYYY-MM-DD string using local calendar time (avoids UTC offset shifts).
 */
export function formatDateToYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD (or ISO string) into a local Date object.
 */
export function parseYmdDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const ymd = trimmed.split('T')[0].split('-');
  if (ymd.length === 3) {
    const y = parseInt(ymd[0], 10);
    const m = parseInt(ymd[1], 10) - 1;
    const d = parseInt(ymd[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && y > 1000 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      const dt = new Date(y, m, d, 12, 0, 0); // Noon prevents DST boundary edge issues
      if (!isNaN(dt.getTime()) && dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d) {
        return dt;
      }
    }
    return null;
  }

  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Returns true if both dates point to the same calendar day.
 */
export function isSameDateDay(
  a: Date | string | null | undefined,
  b: Date | string | null | undefined
): boolean {
  if (!a || !b) return false;
  const dtA = typeof a === 'string' ? parseYmdDate(a) : a;
  const dtB = typeof b === 'string' ? parseYmdDate(b) : b;
  if (!dtA || !dtB || isNaN(dtA.getTime()) || isNaN(dtB.getTime())) return false;
  return (
    dtA.getFullYear() === dtB.getFullYear() &&
    dtA.getMonth() === dtB.getMonth() &&
    dtA.getDate() === dtB.getDate()
  );
}

/**
 * Returns an array of Date objects for the full month calendar grid (including leading/trailing padding days).
 */
export function getMonthCalendarGrid(year: number, month: number, weekStartsOnSunday = true): Date[] {
  const firstDayOfMonth = new Date(year, month, 1, 12, 0, 0);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Calculate leading days
  const leadingDays = weekStartsOnSunday ? dayOfWeek : (dayOfWeek + 6) % 7;

  // Start date
  const startDate = new Date(year, month, 1 - leadingDays, 12, 0, 0);

  const days: Date[] = [];
  // 6 weeks * 7 days = 42 days grid for full consistency across all months
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i, 12, 0, 0);
    days.push(d);
  }

  return days;
}

/**
 * Returns 7 Date objects for the week containing referenceDate.
 */
export function getWeekDays(referenceDate: Date, weekStartsOnSunday = true): Date[] {
  const dayOfWeek = referenceDate.getDay();
  const diffToStart = weekStartsOnSunday ? -dayOfWeek : -((dayOfWeek + 6) % 7);

  const startOfWeek = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate() + diffToStart,
    12,
    0,
    0
  );

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(
      startOfWeek.getFullYear(),
      startOfWeek.getMonth(),
      startOfWeek.getDate() + i,
      12,
      0,
      0
    );
    days.push(d);
  }

  return days;
}

/**
 * Formats the period heading for the calendar (Month, Week, or Day).
 */
export function formatPeriodHeading(
  viewMode: 'month' | 'week' | 'day',
  currentDate: Date
): string {
  if (viewMode === 'month') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(currentDate);
  }

  if (viewMode === 'week') {
    const week = getWeekDays(currentDate);
    const start = week[0];
    const end = week[6];

    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();

    if (sameYear && sameMonth) {
      const monthStr = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start);
      return `${monthStr} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }

    if (sameYear && !sameMonth) {
      const m1 = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start);
      const m2 = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(end);
      return `${m1} ${start.getDate()} – ${m2} ${end.getDate()}, ${start.getFullYear()}`;
    }

    const d1 = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(start);
    const d2 = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end);
    return `${d1} – ${d2}`;
  }

  // Day view
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(currentDate);
}
