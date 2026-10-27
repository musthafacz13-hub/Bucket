import { Goal, Note, Category, GoalPriority, GoalStatus } from '../types';
import { SAMPLE_GOALS, SAMPLE_NOTES, SAMPLE_CATEGORIES } from '../data/fixtures';
import { parseYmdDate } from './date';

const GOALS_KEY = 'bucket_goals_v1';
const NOTES_KEY = 'bucket_notes_v1';
const CATEGORIES_KEY = 'bucket_categories_v1';

const VALID_STATUSES: GoalStatus[] = ['Not Started', 'In Progress', 'Completed'];
const VALID_PRIORITIES: GoalPriority[] = ['Low', 'Medium', 'High'];

export const DEFAULT_CATEGORY_COLOR = '#08C83D'; // Approved Green

function isValidIsoDate(str: unknown): boolean {
  if (typeof str !== 'string' || !str.trim()) return false;
  const time = new Date(str).getTime();
  return !isNaN(time);
}

export function sanitizeCategory(raw: unknown): Category | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const c = raw as Record<string, unknown>;

  if (typeof c.name !== 'string' || !c.name.trim()) return null;
  const name = c.name.trim();

  // Reject reserved names from corrupted storage
  const lowerName = name.toLowerCase();
  if (lowerName === 'all' || lowerName === 'unassigned') {
    return null;
  }

  const id =
    typeof c.id === 'string' && c.id.trim()
      ? c.id.trim()
      : `cat_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

  const color =
    typeof c.color === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c.color.trim())
      ? c.color.trim()
      : DEFAULT_CATEGORY_COLOR;

  const createdAt = isValidIsoDate(c.createdAt) ? (c.createdAt as string) : new Date().toISOString();
  const updatedAt = isValidIsoDate(c.updatedAt) ? (c.updatedAt as string) : createdAt;

  return {
    id,
    name,
    color,
    createdAt,
    updatedAt,
  };
}

function sanitizeGoal(raw: unknown): Goal | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const g = raw as Record<string, unknown>;

  // Title is strictly required
  if (typeof g.title !== 'string' || !g.title.trim()) return null;

  const id =
    typeof g.id === 'string' && g.id.trim()
      ? g.id.trim()
      : `goal_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const title = g.title.trim();
  const description = typeof g.description === 'string' ? g.description : '';
  const category =
    typeof g.category === 'string'
      ? g.category.trim()
      : g.category === undefined
      ? 'Personal'
      : '';
  const categoryId =
    typeof g.categoryId === 'string' && g.categoryId.trim() ? g.categoryId.trim() : null;
  const priority: GoalPriority = VALID_PRIORITIES.includes(g.priority as GoalPriority)
    ? (g.priority as GoalPriority)
    : 'Medium';
  const status: GoalStatus = VALID_STATUSES.includes(g.status as GoalStatus)
    ? (g.status as GoalStatus)
    : 'Not Started';
  const targetDate =
    typeof g.targetDate === 'string' && parseYmdDate(g.targetDate)
      ? (g.targetDate as string).trim()
      : null;
  const createdAt = isValidIsoDate(g.createdAt) ? (g.createdAt as string) : new Date().toISOString();
  const updatedAt = isValidIsoDate(g.updatedAt) ? (g.updatedAt as string) : createdAt;

  return {
    id,
    title,
    description,
    category,
    categoryId,
    priority,
    status,
    targetDate,
    createdAt,
    updatedAt,
  };
}

function sanitizeNote(raw: unknown): Note | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const n = raw as Record<string, unknown>;

  if (typeof n.title !== 'string' || !n.title.trim()) return null;

  const id =
    typeof n.id === 'string' && n.id.trim()
      ? n.id.trim()
      : `note_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const title = n.title.trim();
  const content = typeof n.content === 'string' ? n.content : '';
  const createdAt = isValidIsoDate(n.createdAt) ? (n.createdAt as string) : new Date().toISOString();
  const updatedAt = isValidIsoDate(n.updatedAt) ? (n.updatedAt as string) : createdAt;
  const isFavorite = Boolean(n.isFavorite);
  const linkedGoalId =
    typeof n.linkedGoalId === 'string' && n.linkedGoalId.trim() ? n.linkedGoalId.trim() : null;
  const categoryId =
    typeof n.categoryId === 'string' && n.categoryId.trim() ? n.categoryId.trim() : null;
  const category =
    typeof n.category === 'string' && n.category.trim() ? n.category.trim() : null;
  const tags = Array.isArray(n.tags)
    ? n.tags.filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
    : [];

  return {
    id,
    title,
    content,
    createdAt,
    updatedAt,
    isFavorite,
    linkedGoalId,
    categoryId,
    category,
    tags,
  };
}

export function loadStoredCategories(): Category[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const sanitized: Category[] = [];

    for (const item of parsed) {
      const valid = sanitizeCategory(item);
      if (valid && !seenIds.has(valid.id) && !seenNames.has(valid.name.toLowerCase())) {
        seenIds.add(valid.id);
        seenNames.add(valid.name.toLowerCase());
        sanitized.push(valid);
      }
    }
    return sanitized;
  } catch (err) {
    console.error('Failed to load categories from localStorage:', err);
    return [];
  }
}

export function saveStoredCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories to localStorage:', err);
  }
}

export function loadStoredGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const sanitized: Goal[] = [];
    for (const item of parsed) {
      const validGoal = sanitizeGoal(item);
      if (validGoal) sanitized.push(validGoal);
    }
    return sanitized;
  } catch (err) {
    console.error('Failed to load goals from localStorage:', err);
    return [];
  }
}

export function saveStoredGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save goals to localStorage:', err);
  }
}

export function loadStoredNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const sanitized: Note[] = [];
    for (const item of parsed) {
      const validNote = sanitizeNote(item);
      if (validNote) sanitized.push(validNote);
    }
    return sanitized;
  } catch (err) {
    console.error('Failed to load notes from localStorage:', err);
    return [];
  }
}

export function saveStoredNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes to localStorage:', err);
  }
}

export function clearWorkspaceData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GOALS_KEY);
    localStorage.removeItem(NOTES_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
  } catch (err) {
    console.error('Failed to clear workspace data:', err);
  }
}

export function getFixtureData(): { goals: Goal[]; notes: Note[]; categories: Category[] } {
  return {
    goals: SAMPLE_GOALS,
    notes: SAMPLE_NOTES,
    categories: SAMPLE_CATEGORIES,
  };
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface WorkspacePreferences {
  theme: ThemeMode;
  defaultCalendarView: 'month' | 'week' | 'day';
  defaultNotesView: 'grid' | 'list';
}

const PREFERENCES_KEY = 'bucket_preferences_v1';

export const DEFAULT_PREFERENCES: WorkspacePreferences = {
  theme: 'light',
  defaultCalendarView: 'month',
  defaultNotesView: 'grid',
};

export function loadStoredPreferences(): WorkspacePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      theme: ['light', 'dark', 'system'].includes(parsed.theme) ? parsed.theme : 'light',
      defaultCalendarView: ['month', 'week', 'day'].includes(parsed.defaultCalendarView)
        ? parsed.defaultCalendarView
        : 'month',
      defaultNotesView: ['grid', 'list'].includes(parsed.defaultNotesView)
        ? parsed.defaultNotesView
        : 'grid',
    };
  } catch (err) {
    console.error('Failed to load preferences from localStorage:', err);
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(prefs: WorkspacePreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences to localStorage:', err);
  }
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  let resolved: 'light' | 'dark' = 'light';
  if (theme === 'dark') {
    resolved = 'dark';
  } else if (theme === 'system') {
    const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    resolved = isDark ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function getStorageUsageEstimate(): {
  totalBytes: number;
  formattedSize: string;
  keysCount: number;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { totalBytes: 0, formattedSize: '0 KB', keysCount: 0 };
  }
  try {
    let bytes = 0;
    let keysCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bucket_')) {
        keysCount++;
        const val = localStorage.getItem(key) || '';
        bytes += (key.length + val.length) * 2; // Approximate UTF-16 byte size
      }
    }
    const kb = (bytes / 1024).toFixed(1);
    return {
      totalBytes: bytes,
      formattedSize: `${kb} KB`,
      keysCount,
    };
  } catch {
    return { totalBytes: 0, formattedSize: '0 KB', keysCount: 0 };
  }
}

