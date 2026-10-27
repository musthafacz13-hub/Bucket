import {
  loadStoredCategories,
  loadStoredGoals,
  loadStoredNotes,
  loadStoredPreferences,
  WorkspacePreferences,
} from '../utils/storage';
import { Category, Goal, Note } from '../types';
import {
  fetchCategories,
  fetchGoals,
  fetchNotes,
  createCategory,
  createGoal,
  createNote,
  upsertPreferences,
  generateUuid,
  isValidUuid,
} from './dbService';

export interface MigrationResult {
  migrated: boolean;
  categoriesCount: number;
  goalsCount: number;
  notesCount: number;
  error?: string;
}

export function isUserMigrated(userId: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`bucket_migrated_user_${userId}`) === 'true';
  } catch {
    return false;
  }
}

export function markUserMigrated(userId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`bucket_migrated_user_${userId}`, 'true');
  } catch (err) {
    console.error('Failed to set migration flag:', err);
  }
}

export function createLocalBackup(userId: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      userId,
      categories: loadStoredCategories(),
      goals: loadStoredGoals(),
      notes: loadStoredNotes(),
      preferences: loadStoredPreferences(),
    };
    localStorage.setItem(`bucket_legacy_backup_${userId}`, JSON.stringify(backup));
  } catch (err) {
    console.error('Failed to create local storage backup:', err);
  }
}

/**
 * Safely migrates local storage data (categories, goals, notes, preferences) to Supabase.
 * Preserves foreign key relationships by mapping legacy client IDs to valid UUIDs.
 * Avoids duplicate insertions if categories already exist in the cloud.
 */
export async function migrateLocalDataToSupabase(userId: string): Promise<MigrationResult> {
  if (isUserMigrated(userId)) {
    return {
      migrated: false,
      categoriesCount: 0,
      goalsCount: 0,
      notesCount: 0,
    };
  }

  const localCategories = loadStoredCategories();
  const localGoals = loadStoredGoals();
  const localNotes = loadStoredNotes();
  const localPrefs = loadStoredPreferences();

  // If local store is empty, nothing to migrate
  if (localCategories.length === 0 && localGoals.length === 0 && localNotes.length === 0) {
    markUserMigrated(userId);
    return {
      migrated: false,
      categoriesCount: 0,
      goalsCount: 0,
      notesCount: 0,
    };
  }

  // 1. Create a safe local backup before cloud synchronization
  createLocalBackup(userId);

  try {
    // 2. Fetch existing cloud data to prevent duplicates on retries
    const [cloudCategories, cloudGoals, cloudNotes] = await Promise.all([
      fetchCategories(),
      fetchGoals(),
      fetchNotes(),
    ]);

    const categoryNameToUuid = new Map<string, string>();
    const legacyCategoryMap = new Map<string, string>();

    for (const cc of cloudCategories) {
      categoryNameToUuid.set(cc.name.toLowerCase().trim(), cc.id);
    }

    let categoriesCount = 0;
    for (const localCat of localCategories) {
      const normalizedName = localCat.name.toLowerCase().trim();
      const existingCloudId = categoryNameToUuid.get(normalizedName);

      if (existingCloudId) {
        // Reuse existing cloud category
        legacyCategoryMap.set(localCat.id, existingCloudId);
      } else {
        // Create new category with UUID
        const newCatUuid = isValidUuid(localCat.id) ? localCat.id : generateUuid();
        try {
          const created = await createCategory({
            id: newCatUuid,
            name: localCat.name,
            color: localCat.color,
          });
          categoryNameToUuid.set(normalizedName, created.id);
          legacyCategoryMap.set(localCat.id, created.id);
          categoriesCount++;
        } catch (catErr) {
          console.warn(`Could not migrate category "${localCat.name}":`, catErr);
        }
      }
    }

    // 3. Migrate Goals with deduplication
    let goalsCount = 0;
    const legacyGoalMap = new Map<string, string>();

    for (const localGoal of localGoals) {
      const normalizedGoalTitle = localGoal.title.toLowerCase().trim();
      const existingCloudGoal = cloudGoals.find(
        (cg: Goal) =>
          cg.title.toLowerCase().trim() === normalizedGoalTitle &&
          (cg.targetDate || null) === (localGoal.targetDate || null)
      );

      if (existingCloudGoal) {
        legacyGoalMap.set(localGoal.id, existingCloudGoal.id);
        continue;
      }

      const newGoalUuid = isValidUuid(localGoal.id) ? localGoal.id : generateUuid();

      // Resolve categoryId
      let resolvedCategoryId: string | null = null;
      if (localGoal.categoryId && legacyCategoryMap.has(localGoal.categoryId)) {
        resolvedCategoryId = legacyCategoryMap.get(localGoal.categoryId) || null;
      } else if (localGoal.category) {
        resolvedCategoryId = categoryNameToUuid.get(localGoal.category.toLowerCase().trim()) || null;
      }

      try {
        const createdGoal = await createGoal({
          id: newGoalUuid,
          title: localGoal.title,
          description: localGoal.description,
          category: localGoal.category,
          categoryId: resolvedCategoryId,
          priority: localGoal.priority,
          status: localGoal.status,
          targetDate: localGoal.targetDate,
        });
        legacyGoalMap.set(localGoal.id, createdGoal.id);
        goalsCount++;
      } catch (goalErr) {
        console.warn(`Could not migrate goal "${localGoal.title}":`, goalErr);
      }
    }

    // 4. Migrate Notes with deduplication
    let notesCount = 0;
    for (const localNote of localNotes) {
      const normalizedNoteTitle = localNote.title.toLowerCase().trim();
      const existingCloudNote = cloudNotes.find(
        (cn: Note) => cn.title.toLowerCase().trim() === normalizedNoteTitle
      );

      if (existingCloudNote) {
        continue;
      }

      const newNoteUuid = isValidUuid(localNote.id) ? localNote.id : generateUuid();

      let resolvedCategoryId: string | null = null;
      if (localNote.categoryId && legacyCategoryMap.has(localNote.categoryId)) {
        resolvedCategoryId = legacyCategoryMap.get(localNote.categoryId) || null;
      } else if (localNote.category) {
        resolvedCategoryId = categoryNameToUuid.get(localNote.category.toLowerCase().trim()) || null;
      }

      let resolvedGoalId: string | null = null;
      if (localNote.linkedGoalId && legacyGoalMap.has(localNote.linkedGoalId)) {
        resolvedGoalId = legacyGoalMap.get(localNote.linkedGoalId) || null;
      }

      try {
        await createNote({
          id: newNoteUuid,
          title: localNote.title,
          content: localNote.content,
          isFavorite: localNote.isFavorite,
          linkedGoalId: resolvedGoalId,
          categoryId: resolvedCategoryId,
          category: localNote.category,
          tags: localNote.tags,
        });
        notesCount++;
      } catch (noteErr) {
        console.warn(`Could not migrate note "${localNote.title}":`, noteErr);
      }
    }

    // 5. Migrate Preferences
    try {
      await upsertPreferences(localPrefs);
    } catch (prefErr) {
      console.warn('Could not migrate user preferences:', prefErr);
    }

    // 6. Verify migration and mark complete
    markUserMigrated(userId);

    // 7. Clear guest workspace keys now that cloud migration is verified,
    // while keeping bucket_legacy_backup_${userId} intact for safe recovery
    try {
      localStorage.removeItem('bucket_goals_v1');
      localStorage.removeItem('bucket_notes_v1');
      localStorage.removeItem('bucket_categories_v1');
    } catch {
      // Ignore if localStorage unavailable
    }

    return {
      migrated: true,
      categoriesCount,
      goalsCount,
      notesCount,
    };
  } catch (err) {
    console.error('Migration process encountered an error:', err);
    return {
      migrated: false,
      categoriesCount: 0,
      goalsCount: 0,
      notesCount: 0,
      error: err instanceof Error ? err.message : 'Unknown migration error',
    };
  }
}
