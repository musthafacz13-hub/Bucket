import { Goal, Category, GoalPriority } from '../types';
import { parseYmdDate, isSameDateDay } from './date';
import { calculateCompletionRate } from './calculations';

export type TimeRangeOption = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsOverview {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  inProgressGoals: number;
  notStartedGoals: number;
  completionRate: number;
  overdueCount: number;
  dueTodayCount: number;
  upcomingCount: number;
  noTargetDateCount: number;
  overdueGoals: Goal[];
  dueTodayGoals: Goal[];
}

export interface CategoryStat {
  id: string;
  name: string;
  color: string;
  total: number;
  completed: number;
  active: number;
  completionRate: number;
}

export interface PriorityStat {
  priority: GoalPriority;
  total: number;
  completed: number;
  active: number;
  completionRate: number;
}

export interface DeadlineBreakdown {
  overdue: Goal[];
  dueToday: Goal[];
  dueThisWeek: Goal[];
  dueLater: Goal[];
  noDeadline: Goal[];
}

export interface TrendDataPoint {
  label: string;
  dateKey: string;
  createdCount: number;
  completedCount: number;
}

/**
 * Derives comprehensive high-level analytics metrics.
 * Ensures completed goals are strictly excluded from overdue counts.
 */
export function calculateAnalyticsOverview(goals: Goal[]): AnalyticsOverview {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  let completedGoals = 0;
  let inProgressGoals = 0;
  let notStartedGoals = 0;

  const overdueGoals: Goal[] = [];
  const dueTodayGoals: Goal[] = [];
  let upcomingCount = 0;
  let noTargetDateCount = 0;

  for (const goal of goals) {
    if (goal.status === 'Completed') {
      completedGoals++;
    } else if (goal.status === 'In Progress') {
      inProgressGoals++;
    } else {
      notStartedGoals++;
    }

    if (!goal.targetDate || !goal.targetDate.trim()) {
      noTargetDateCount++;
      continue;
    }

    const dt = parseYmdDate(goal.targetDate);
    if (!dt) {
      noTargetDateCount++;
      continue;
    }

    if (isSameDateDay(dt, now)) {
      dueTodayGoals.push(goal);
    } else if (dt.getTime() < startOfToday.getTime()) {
      // Strictly exclude completed goals from overdue count
      if (goal.status !== 'Completed') {
        overdueGoals.push(goal);
      }
    } else {
      upcomingCount++;
    }
  }

  const totalGoals = goals.length;
  const activeGoals = inProgressGoals + notStartedGoals;
  const completionRate = calculateCompletionRate(completedGoals, totalGoals);

  return {
    totalGoals,
    completedGoals,
    activeGoals,
    inProgressGoals,
    notStartedGoals,
    completionRate,
    overdueCount: overdueGoals.length,
    dueTodayCount: dueTodayGoals.length,
    upcomingCount,
    noTargetDateCount,
    overdueGoals,
    dueTodayGoals,
  };
}

/**
 * Calculates category-level goal distributions and completion rates.
 * Resolves both categoryId and fallback category string, including unassigned items.
 */
export function calculateCategoryAnalytics(
  goals: Goal[],
  categories: Category[]
): { categoryStats: CategoryStat[]; unassignedStat: CategoryStat } {
  // Category lookup maps
  const catIdMap = new Map<string, Category>();
  const catNameMap = new Map<string, Category>();
  for (const c of categories) {
    catIdMap.set(c.id, c);
    catNameMap.set(c.name.toLowerCase().trim(), c);
  }

  // Aggregate bucket for defined categories
  const statsMap = new Map<
    string,
    { id: string; name: string; color: string; total: number; completed: number; active: number }
  >();

  for (const c of categories) {
    statsMap.set(c.id, {
      id: c.id,
      name: c.name,
      color: c.color,
      total: 0,
      completed: 0,
      active: 0,
    });
  }

  let unassignedTotal = 0;
  let unassignedCompleted = 0;
  let unassignedActive = 0;

  for (const goal of goals) {
    let resolvedCategory: Category | undefined;

    if (goal.categoryId && catIdMap.has(goal.categoryId)) {
      resolvedCategory = catIdMap.get(goal.categoryId);
    } else if (goal.category && goal.category.trim()) {
      resolvedCategory = catNameMap.get(goal.category.toLowerCase().trim());
    }

    const isCompleted = goal.status === 'Completed';

    if (resolvedCategory && statsMap.has(resolvedCategory.id)) {
      const stat = statsMap.get(resolvedCategory.id)!;
      stat.total++;
      if (isCompleted) {
        stat.completed++;
      } else {
        stat.active++;
      }
    } else {
      unassignedTotal++;
      if (isCompleted) {
        unassignedCompleted++;
      } else {
        unassignedActive++;
      }
    }
  }

  const categoryStats: CategoryStat[] = Array.from(statsMap.values()).map((s) => ({
    ...s,
    completionRate: calculateCompletionRate(s.completed, s.total),
  }));

  // Sort defined categories by total goals descending
  categoryStats.sort((a, b) => b.total - a.total);

  const unassignedStat: CategoryStat = {
    id: 'unassigned',
    name: 'Unassigned',
    color: '#8E8EA0',
    total: unassignedTotal,
    completed: unassignedCompleted,
    active: unassignedActive,
    completionRate: calculateCompletionRate(unassignedCompleted, unassignedTotal),
  };

  return { categoryStats, unassignedStat };
}

/**
 * Calculates priority-level goal distributions and completion rates.
 */
export function calculatePriorityAnalytics(goals: Goal[]): PriorityStat[] {
  const priorities: GoalPriority[] = ['High', 'Medium', 'Low'];
  const map: Record<GoalPriority, { total: number; completed: number; active: number }> = {
    High: { total: 0, completed: 0, active: 0 },
    Medium: { total: 0, completed: 0, active: 0 },
    Low: { total: 0, completed: 0, active: 0 },
  };

  for (const goal of goals) {
    const p = priorities.includes(goal.priority) ? goal.priority : 'Medium';
    map[p].total++;
    if (goal.status === 'Completed') {
      map[p].completed++;
    } else {
      map[p].active++;
    }
  }

  return priorities.map((p) => ({
    priority: p,
    total: map[p].total,
    completed: map[p].completed,
    active: map[p].active,
    completionRate: calculateCompletionRate(map[p].completed, map[p].total),
  }));
}

/**
 * Categorizes goals into deadline status groups.
 */
export function calculateDeadlineBreakdown(goals: Goal[]): DeadlineBreakdown {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const inOneWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdue: Goal[] = [];
  const dueToday: Goal[] = [];
  const dueThisWeek: Goal[] = [];
  const dueLater: Goal[] = [];
  const noDeadline: Goal[] = [];

  for (const goal of goals) {
    if (!goal.targetDate || !goal.targetDate.trim()) {
      noDeadline.push(goal);
      continue;
    }

    const dt = parseYmdDate(goal.targetDate);
    if (!dt) {
      noDeadline.push(goal);
      continue;
    }

    if (isSameDateDay(dt, now)) {
      dueToday.push(goal);
    } else if (dt.getTime() < startOfToday.getTime()) {
      // Exclude completed from overdue
      if (goal.status !== 'Completed') {
        overdue.push(goal);
      } else {
        dueLater.push(goal);
      }
    } else if (dt.getTime() <= inOneWeek.getTime()) {
      dueThisWeek.push(goal);
    } else {
      dueLater.push(goal);
    }
  }

  // Sort upcoming chronologically
  const sortByTarget = (a: Goal, b: Goal) => {
    const timeA = a.targetDate ? parseYmdDate(a.targetDate)?.getTime() || 0 : 0;
    const timeB = b.targetDate ? parseYmdDate(b.targetDate)?.getTime() || 0 : 0;
    return timeA - timeB;
  };

  overdue.sort(sortByTarget);
  dueToday.sort(sortByTarget);
  dueThisWeek.sort(sortByTarget);
  dueLater.sort(sortByTarget);

  return {
    overdue,
    dueToday,
    dueThisWeek,
    dueLater,
    noDeadline,
  };
}

/**
 * Builds goal timeline creation and status distribution based on verifiable timestamps.
 * Accurately surfaces data without inventing historical completion points.
 */
export function calculateGoalTrends(
  goals: Goal[],
  range: TimeRangeOption
): {
  dataPoints: TrendDataPoint[];
  totalInRange: number;
  completedInRange: number;
} {
  const now = new Date();
  let days = 30;
  if (range === '7d') days = 7;
  else if (range === '90d') days = 90;
  else if (range === 'all') days = 180; // Sample up to 180 days or dynamic

  const startTime = range === 'all' ? 0 : now.getTime() - days * 24 * 60 * 60 * 1000;

  // Filter goals created within time range
  const goalsInRange = goals.filter((g) => {
    if (!g.createdAt) return true;
    const t = new Date(g.createdAt).getTime();
    return isNaN(t) || t >= startTime;
  });

  const totalInRange = goalsInRange.length;
  const completedInRange = goalsInRange.filter((g) => g.status === 'Completed').length;

  // Generate bucket intervals (daily for 7d, every 3-5 days for 30d, weekly for 90d+)
  const intervalDays = range === '7d' ? 1 : range === '30d' ? 3 : 7;
  const numBuckets = Math.min(14, Math.ceil(days / intervalDays));
  const dataPoints: TrendDataPoint[] = [];

  for (let i = numBuckets - 1; i >= 0; i--) {
    const bucketEndTime = new Date(now.getTime() - i * intervalDays * 24 * 60 * 60 * 1000);
    const bucketStartTime = new Date(bucketEndTime.getTime() - intervalDays * 24 * 60 * 60 * 1000);

    const label = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(bucketEndTime);

    const bucketGoals = goals.filter((g) => {
      const t = g.createdAt ? new Date(g.createdAt).getTime() : 0;
      return t >= bucketStartTime.getTime() && t <= bucketEndTime.getTime();
    });

    const createdCount = bucketGoals.length;
    const completedCount = bucketGoals.filter((g) => g.status === 'Completed').length;

    dataPoints.push({
      label,
      dateKey: bucketEndTime.toISOString(),
      createdCount,
      completedCount,
    });
  }

  return {
    dataPoints,
    totalInRange,
    completedInRange,
  };
}
