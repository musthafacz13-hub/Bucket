import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category, Goal, Note, GoalPriority, GoalStatus } from '../types';
import { WorkspacePreferences, DEFAULT_PREFERENCES } from '../utils/storage';

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id.trim()
  );
}

function normalizeTargetDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function normalizeColor(color?: string): string {
  if (color && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim())) {
    return color.trim();
  }
  return '#08C83D';
}

function ensureClient(): NonNullable<typeof supabase> {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return supabase;
}

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

export interface DbCategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export function mapCategoryFromDb(row: DbCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapCategoryFromDb);
}

export async function createCategory(cat: {
  id?: string;
  name: string;
  color?: string;
}): Promise<Category> {
  const client = ensureClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('User is not authenticated.');

  const trimmedName = cat.name.trim();
  const lowerName = trimmedName.toLowerCase();
  if (!trimmedName || lowerName === 'all' || lowerName === 'unassigned') {
    throw new Error('Invalid category name.');
  }

  const id = cat.id && isValidUuid(cat.id) ? cat.id : generateUuid();
  const color = normalizeColor(cat.color);

  const { data, error } = await client
    .from('categories')
    .insert({
      id,
      user_id: user.id,
      name: trimmedName,
      color,
    })
    .select()
    .single();

  if (error) throw error;
  return mapCategoryFromDb(data);
}

export async function updateCategory(
  id: string,
  updates: { name?: string; color?: string }
): Promise<Category> {
  const client = ensureClient();
  if (!isValidUuid(id)) throw new Error('Invalid category UUID.');

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    const lower = trimmed.toLowerCase();
    if (!trimmed || lower === 'all' || lower === 'unassigned') {
      throw new Error('Invalid category name.');
    }
    payload.name = trimmed;
  }

  if (updates.color !== undefined) {
    payload.color = normalizeColor(updates.color);
  }

  const { data, error } = await client
    .from('categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapCategoryFromDb(data);
}

export async function deleteCategory(id: string): Promise<void> {
  const client = ensureClient();
  if (!isValidUuid(id)) return;

  const { error } = await client.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// GOALS
// ---------------------------------------------------------------------------

export interface DbGoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  category_id: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function mapGoalFromDb(row: DbGoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'Personal',
    categoryId: row.category_id || null,
    priority: row.priority || 'Medium',
    status: row.status || 'Not Started',
    targetDate: row.target_date || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchGoals(): Promise<Goal[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapGoalFromDb);
}

export async function createGoal(goal: {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  categoryId?: string | null;
  priority?: GoalPriority;
  status?: GoalStatus;
  targetDate?: string | null;
}): Promise<Goal> {
  const client = ensureClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('User is not authenticated.');

  const trimmedTitle = goal.title.trim();
  if (!trimmedTitle) throw new Error('Goal title is required.');

  const id = goal.id && isValidUuid(goal.id) ? goal.id : generateUuid();
  const validCategoryId =
    goal.categoryId && isValidUuid(goal.categoryId) ? goal.categoryId : null;

  const payload = {
    id,
    user_id: user.id,
    title: trimmedTitle,
    description: goal.description || '',
    category: goal.category ? goal.category.trim() : 'Personal',
    category_id: validCategoryId,
    priority: goal.priority || 'Medium',
    status: goal.status || 'Not Started',
    target_date: normalizeTargetDate(goal.targetDate),
  };

  const { data, error } = await client.from('goals').insert(payload).select().single();
  if (error) throw error;
  return mapGoalFromDb(data);
}

export async function updateGoal(
  id: string,
  updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Goal> {
  const client = ensureClient();
  if (!isValidUuid(id)) throw new Error('Invalid goal UUID.');

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    const trimmed = updates.title.trim();
    if (!trimmed) throw new Error('Goal title cannot be empty.');
    payload.title = trimmed;
  }
  if (updates.description !== undefined) {
    payload.description = updates.description;
  }
  if (updates.category !== undefined) {
    payload.category = updates.category ? updates.category.trim() : 'Personal';
  }
  if (updates.categoryId !== undefined) {
    payload.category_id =
      updates.categoryId && isValidUuid(updates.categoryId) ? updates.categoryId : null;
  }
  if (updates.priority !== undefined) {
    payload.priority = updates.priority;
  }
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }
  if (updates.targetDate !== undefined) {
    payload.target_date = normalizeTargetDate(updates.targetDate);
  }

  const { data, error } = await client
    .from('goals')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapGoalFromDb(data);
}

export async function deleteGoal(id: string): Promise<void> {
  const client = ensureClient();
  if (!isValidUuid(id)) return;

  const { error } = await client.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// NOTES
// ---------------------------------------------------------------------------

export interface DbNoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_favorite: boolean;
  linked_goal_id: string | null;
  category_id: string | null;
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function mapNoteFromDb(row: DbNoteRow): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    isFavorite: Boolean(row.is_favorite),
    linkedGoalId: row.linked_goal_id || null,
    categoryId: row.category_id || null,
    category: row.category || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchNotes(): Promise<Note[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapNoteFromDb);
}

export async function createNote(note: {
  id?: string;
  title: string;
  content?: string;
  isFavorite?: boolean;
  linkedGoalId?: string | null;
  categoryId?: string | null;
  category?: string | null;
  tags?: string[];
}): Promise<Note> {
  const client = ensureClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('User is not authenticated.');

  const trimmedTitle = note.title.trim();
  if (!trimmedTitle) throw new Error('Note title is required.');

  const id = note.id && isValidUuid(note.id) ? note.id : generateUuid();
  const validCategoryId =
    note.categoryId && isValidUuid(note.categoryId) ? note.categoryId : null;
  const validLinkedGoalId =
    note.linkedGoalId && isValidUuid(note.linkedGoalId) ? note.linkedGoalId : null;

  const payload = {
    id,
    user_id: user.id,
    title: trimmedTitle,
    content: note.content || '',
    is_favorite: Boolean(note.isFavorite),
    linked_goal_id: validLinkedGoalId,
    category_id: validCategoryId,
    category: note.category ? note.category.trim() : null,
    tags: Array.isArray(note.tags) ? note.tags : [],
  };

  const { data, error } = await client.from('notes').insert(payload).select().single();
  if (error) throw error;
  return mapNoteFromDb(data);
}

export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Note> {
  const client = ensureClient();
  if (!isValidUuid(id)) throw new Error('Invalid note UUID.');

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) {
    const trimmed = updates.title.trim();
    if (!trimmed) throw new Error('Note title cannot be empty.');
    payload.title = trimmed;
  }
  if (updates.content !== undefined) {
    payload.content = updates.content;
  }
  if (updates.isFavorite !== undefined) {
    payload.is_favorite = Boolean(updates.isFavorite);
  }
  if (updates.linkedGoalId !== undefined) {
    payload.linked_goal_id =
      updates.linkedGoalId && isValidUuid(updates.linkedGoalId)
        ? updates.linkedGoalId
        : null;
  }
  if (updates.categoryId !== undefined) {
    payload.category_id =
      updates.categoryId && isValidUuid(updates.categoryId)
        ? updates.categoryId
        : null;
  }
  if (updates.category !== undefined) {
    payload.category = updates.category ? updates.category.trim() : null;
  }
  if (updates.tags !== undefined) {
    payload.tags = Array.isArray(updates.tags) ? updates.tags : [];
  }

  const { data, error } = await client
    .from('notes')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapNoteFromDb(data);
}

export async function deleteNote(id: string): Promise<void> {
  const client = ensureClient();
  if (!isValidUuid(id)) return;

  const { error } = await client.from('notes').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// PREFERENCES
// ---------------------------------------------------------------------------

export interface DbPreferencesRow {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  default_calendar_view: 'month' | 'week' | 'day';
  default_notes_view: 'grid' | 'list';
  created_at: string;
  updated_at: string;
}

export function mapPreferencesFromDb(row: DbPreferencesRow): WorkspacePreferences {
  return {
    theme: ['light', 'dark', 'system'].includes(row.theme) ? row.theme : 'light',
    defaultCalendarView: ['month', 'week', 'day'].includes(row.default_calendar_view)
      ? row.default_calendar_view
      : 'month',
    defaultNotesView: ['grid', 'list'].includes(row.default_notes_view)
      ? row.default_notes_view
      : 'grid',
  };
}

export async function fetchPreferences(): Promise<WorkspacePreferences | null> {
  const client = ensureClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapPreferencesFromDb(data);
}

export async function upsertPreferences(
  prefs: WorkspacePreferences
): Promise<WorkspacePreferences> {
  const client = ensureClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('User is not authenticated.');

  const payload = {
    user_id: user.id,
    theme: prefs.theme,
    default_calendar_view: prefs.defaultCalendarView,
    default_notes_view: prefs.defaultNotesView,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return mapPreferencesFromDb(data);
}

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------

export interface DbProfileRow {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapProfileFromDb(row: DbProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchProfile(): Promise<Profile | null> {
  const client = ensureClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapProfileFromDb(data);
}

export async function updateProfileDisplayName(displayName: string): Promise<Profile> {
  const client = ensureClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error('User is not authenticated.');

  const trimmed = displayName.trim().slice(0, 100);

  const { data, error } = await client
    .from('profiles')
    .update({
      display_name: trimmed || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return mapProfileFromDb(data);
}

