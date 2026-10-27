import { Goal, Note, Category, OverviewMetrics, GoalSortOption, NoteSortOption, GoalPriority, GoalStatus } from '../types';
import { isUpcomingDate } from './date';

/**
 * Calculates the completion rate percentage (0 to 100), rounded to the nearest integer.
 * Safely handles 0 total goals.
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total <= 0) return 0;
  const rate = Math.round((completed / total) * 100);
  return Math.min(100, Math.max(0, rate));
}

/**
 * Derives the four primary dashboard overview metrics from the current goals state.
 */
export function calculateMetrics(goals: Goal[]): OverviewMetrics {
  const totalGoals = goals.length;
  let inProgress = 0;
  let completed = 0;

  for (const goal of goals) {
    if (goal.status === 'Completed') {
      completed++;
    } else if (goal.status === 'In Progress') {
      inProgress++;
    }
  }

  const completionRate = calculateCompletionRate(completed, totalGoals);

  return {
    totalGoals,
    inProgress,
    completed,
    completionRate,
  };
}

/**
 * Returns goals with 'Completed' status.
 */
export function filterCompletedGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === 'Completed');
}

/**
 * Returns goals with 'In Progress' status.
 */
export function filterInProgressGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === 'In Progress');
}

/**
 * Returns goals with future target dates that are not yet completed,
 * sorted chronologically by target date ascending.
 */
export function getUpcomingGoals(goals: Goal[]): Goal[] {
  return goals
    .filter((g) => g.targetDate && g.status !== 'Completed' && isUpcomingDate(g.targetDate))
    .sort((a, b) => {
      const dateA = new Date(a.targetDate!).getTime();
      const dateB = new Date(b.targetDate!).getTime();
      return dateA - dateB;
    });
}

/**
 * Sorts items by their updatedAt timestamp descending (most recently updated first).
 */
export function sortRecentlyUpdated<T extends { updatedAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.updatedAt).getTime() || 0;
    const timeB = new Date(b.updatedAt).getTime() || 0;
    return timeB - timeA;
  });
}

/**
 * Generates a clean single-line text preview for a note, stripping extra whitespace.
 */
export function generateNotePreview(content: string, maxLength = 100): string {
  if (!content) return 'No additional text';
  const clean = content.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength) + '...';
}

const PRIORITY_RANK: Record<GoalPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

/**
 * Deterministically sorts goals according to the selected option.
 */
export function sortGoals(goals: Goal[], sortOption: GoalSortOption): Goal[] {
  const result = [...goals];

  switch (sortOption) {
    case 'recently-updated':
      return result.sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime() || 0;
        const timeB = new Date(b.updatedAt).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.id.localeCompare(b.id);
      });

    case 'date-added':
      return result.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.id.localeCompare(b.id);
      });

    case 'target-date':
      return result.sort((a, b) => {
        const timeA = a.targetDate ? new Date(a.targetDate).getTime() : NaN;
        const timeB = b.targetDate ? new Date(b.targetDate).getTime() : NaN;
        const isValidA = !isNaN(timeA);
        const isValidB = !isNaN(timeB);

        // Valid dated goals come before undated or invalid goals
        if (isValidA && !isValidB) return -1;
        if (!isValidA && isValidB) return 1;

        if (isValidA && isValidB && timeA !== timeB) {
          return timeA - timeB; // Closest target date first
        }

        // Secondary sort: recently updated descending
        const updateA = new Date(a.updatedAt).getTime() || 0;
        const updateB = new Date(b.updatedAt).getTime() || 0;
        if (updateB !== updateA) return updateB - updateA;
        return a.id.localeCompare(b.id);
      });

    case 'alphabetical':
      return result.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        return a.id.localeCompare(b.id);
      });

    case 'priority':
      return result.sort((a, b) => {
        const rankA = PRIORITY_RANK[a.priority] || 0;
        const rankB = PRIORITY_RANK[b.priority] || 0;
        if (rankB !== rankA) return rankB - rankA; // High > Medium > Low

        // Secondary sort: recently updated descending
        const updateA = new Date(a.updatedAt).getTime() || 0;
        const updateB = new Date(b.updatedAt).getTime() || 0;
        if (updateB !== updateA) return updateB - updateA;
        return a.id.localeCompare(b.id);
      });

    default:
      return result;
  }
}

export interface GoalFilterOptions {
  searchQuery: string;
  status: 'All' | GoalStatus;
  category: string; // 'All', 'Unassigned', or specific category name/id
  priority: 'All' | GoalPriority;
}

/**
 * Combines search, status, category, and priority filters into a unified filter pipeline.
 */
export function filterGoals(goals: Goal[], filters: GoalFilterOptions): Goal[] {
  const query = filters.searchQuery.toLowerCase().trim();

  return goals.filter((goal) => {
    // 1. Status Filter
    if (filters.status !== 'All' && goal.status !== filters.status) {
      return false;
    }

    // 2. Category Filter
    if (filters.category !== 'All') {
      if (filters.category === 'Unassigned') {
        const hasNoCategory =
          !goal.categoryId &&
          (!goal.category || !goal.category.trim() || goal.category.toLowerCase() === 'unassigned');
        if (!hasNoCategory) return false;
      } else {
        const matchesName =
          Boolean(goal.category) && goal.category.toLowerCase() === filters.category.toLowerCase();
        const matchesId = Boolean(goal.categoryId) && goal.categoryId === filters.category;
        if (!matchesName && !matchesId) {
          return false;
        }
      }
    }

    // 3. Priority Filter
    if (filters.priority !== 'All' && goal.priority !== filters.priority) {
      return false;
    }

    // 4. Search Filter (title, description, category)
    if (query) {
      const matchTitle = goal.title.toLowerCase().includes(query);
      const matchDesc = goal.description ? goal.description.toLowerCase().includes(query) : false;
      const matchCat = goal.category ? goal.category.toLowerCase().includes(query) : false;
      if (!matchTitle && !matchDesc && !matchCat) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Extracts and deduplicates all categories present in the current goals and defined categories.
 */
export function getAvailableCategories(goals: Goal[], categories: Category[] = []): string[] {
  const seenLower = new Set<string>();
  const result: string[] = [];

  // Add defined categories first
  for (const c of categories) {
    const trimmed = c.name?.trim();
    if (trimmed && trimmed.toLowerCase() !== 'all' && trimmed.toLowerCase() !== 'unassigned') {
      const lower = trimmed.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        result.push(trimmed);
      }
    }
  }

  // Add any existing goal categories
  for (const g of goals) {
    const trimmed = g.category?.trim();
    if (trimmed && trimmed.toLowerCase() !== 'all' && trimmed.toLowerCase() !== 'unassigned') {
      const lower = trimmed.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        result.push(trimmed);
      }
    }
  }

  return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/**
 * Deterministically sorts notes according to the selected NoteSortOption.
 * Safely handles missing, invalid timestamps, or identical titles.
 */
export function sortNotes(notes: Note[], sortOption: NoteSortOption): Note[] {
  const result = [...notes];

  switch (sortOption) {
    case 'recently-updated':
      return result.sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime() || 0;
        const timeB = new Date(b.updatedAt).getTime() || 0;
        if (timeB !== timeA) return timeB - timeA;
        return a.id.localeCompare(b.id);
      });

    case 'oldest-updated':
      return result.sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime() || 0;
        const timeB = new Date(b.updatedAt).getTime() || 0;
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id);
      });

    case 'alphabetical-asc':
      return result.sort((a, b) => {
        const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        return a.id.localeCompare(b.id);
      });

    case 'alphabetical-desc':
      return result.sort((a, b) => {
        const cmp = b.title.localeCompare(a.title, undefined, { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        return b.id.localeCompare(a.id);
      });

    default:
      return result;
  }
}

/**
 * Filters notes across title and content with case-insensitive matching and whitespace trimming.
 * Optionally filters for favorite notes and category.
 */
export function filterNotes(
  notes: Note[],
  searchQuery: string,
  favoriteOnly = false,
  categoryFilter = 'All'
): Note[] {
  const query = searchQuery.toLowerCase().trim();

  return notes.filter((note) => {
    // 1. Favorites filter
    if (favoriteOnly && !note.isFavorite) {
      return false;
    }

    // 2. Category filter
    if (categoryFilter !== 'All') {
      if (categoryFilter === 'Unassigned') {
        const hasNoCategory =
          !note.categoryId &&
          (!note.category || !note.category.trim() || note.category.toLowerCase() === 'unassigned');
        if (!hasNoCategory) return false;
      } else {
        const matchesName =
          Boolean(note.category && note.category.toLowerCase() === categoryFilter.toLowerCase());
        const matchesId = Boolean(note.categoryId && note.categoryId === categoryFilter);
        if (!matchesName && !matchesId) {
          return false;
        }
      }
    }

    // 3. Search query (title, content, tags)
    if (query) {
      const matchTitle = (note.title || '').toLowerCase().includes(query);
      const matchContent = (note.content || '').toLowerCase().includes(query);
      const matchTags = Array.isArray(note.tags)
        ? note.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(query))
        : false;

      if (!matchTitle && !matchContent && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Derives accurate summary metrics for the notes collection.
 */
export function calculateNoteMetrics(notes: Note[]): {
  totalNotes: number;
  favoritesCount: number;
  recentlyUpdatedCount: number;
} {
  const totalNotes = notes.length;
  let favoritesCount = 0;
  let recentlyUpdatedCount = 0;

  // Recent definition: updated within last 7 days
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  for (const n of notes) {
    if (n.isFavorite) {
      favoritesCount++;
    }
    const updateTime = new Date(n.updatedAt).getTime() || 0;
    if (updateTime >= sevenDaysAgo) {
      recentlyUpdatedCount++;
    }
  }

  return {
    totalNotes,
    favoritesCount,
    recentlyUpdatedCount,
  };
}

export interface CategoryCountItem {
  categoryId: string;
  categoryName: string;
  goalCount: number;
  noteCount: number;
}

/**
 * Accurately calculates associated goal and note counts for all categories in state.
 */
export function calculateCategoryCounts(
  categories: Category[],
  goals: Goal[],
  notes: Note[]
): {
  countsMap: Map<string, { goalCount: number; noteCount: number }>;
  unassigned: { goalCount: number; noteCount: number };
} {
  const countsMap = new Map<string, { goalCount: number; noteCount: number }>();

  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase().trim();
    let goalCount = 0;
    let noteCount = 0;

    for (const g of goals) {
      if (
        g.categoryId === cat.id ||
        (g.category && g.category.toLowerCase().trim() === catNameLower)
      ) {
        goalCount++;
      }
    }

    for (const n of notes) {
      if (
        n.categoryId === cat.id ||
        (n.category && n.category.toLowerCase().trim() === catNameLower)
      ) {
        noteCount++;
      }
    }

    countsMap.set(cat.id, { goalCount, noteCount });
  }

  // Count unassigned items
  const assignedCategoryNames = new Set(categories.map((c) => c.name.toLowerCase().trim()));
  const assignedCategoryIds = new Set(categories.map((c) => c.id));

  let unassignedGoals = 0;
  for (const g of goals) {
    const hasValidId = g.categoryId && assignedCategoryIds.has(g.categoryId);
    const hasValidName = g.category && assignedCategoryNames.has(g.category.toLowerCase().trim());
    if (!hasValidId && !hasValidName) {
      unassignedGoals++;
    }
  }

  let unassignedNotes = 0;
  for (const n of notes) {
    const hasValidId = n.categoryId && assignedCategoryIds.has(n.categoryId);
    const hasValidName = n.category && assignedCategoryNames.has(n.category.toLowerCase().trim());
    if (!hasValidId && !hasValidName) {
      unassignedNotes++;
    }
  }

  return {
    countsMap,
    unassigned: {
      goalCount: unassignedGoals,
      noteCount: unassignedNotes,
    },
  };
}
