import { useState, useEffect, useMemo, useCallback } from 'react';
import { Goal, Note, Category, NavigationItem, GoalPriority, GoalStatus } from './types';
import {
  calculateMetrics,
  getUpcomingGoals,
  sortRecentlyUpdated,
} from './utils/calculations';
import {
  loadStoredGoals,
  loadStoredNotes,
  loadStoredCategories,
  clearWorkspaceData,
  loadStoredPreferences,
  DEFAULT_PREFERENCES,
  applyTheme,
  WorkspacePreferences,
} from './utils/storage';
import { parseYmdDate } from './utils/date';
import { AppShell } from './components/layout/AppShell';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { BucketListScreen } from './components/bucket/BucketListScreen';
import { ComingSoonView } from './components/common/ComingSoonView';
import { GoalModal } from './components/goals/GoalModal';
import { GoalDeleteModal } from './components/goals/GoalDeleteModal';
import { GoalDetailModal } from './components/goals/GoalDetailModal';
import { NoteModal } from './components/notes/NoteModal';
import { NoteDeleteModal } from './components/notes/NoteDeleteModal';
import { NoteDetailModal } from './components/notes/NoteDetailModal';
import { NotesScreen } from './components/notes/NotesScreen';
import { CategoriesScreen } from './components/categories/CategoriesScreen';
import { CategoryModal } from './components/categories/CategoryModal';
import { CategoryDetailModal } from './components/categories/CategoryDetailModal';
import { CategoryDeleteModal } from './components/categories/CategoryDeleteModal';
import { CalendarScreen } from './components/calendar/CalendarScreen';
import { AnalyticsScreen } from './components/analytics/AnalyticsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { AgentScreen } from './components/agent/AgentScreen';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { Toast, ToastMessage } from './components/common/Toast';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { VerificationPage } from './components/auth/VerificationPage';
import { AuthPage } from './components/auth/AuthPage';
import {
  AuthUser,
  getActiveSession,
  signOut,
  subscribeToAuthChanges,
} from './services/authService';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  fetchPreferences,
  upsertPreferences,
} from './services/dbService';

export type AppView =
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'verify'
  | 'app';

export default function App() {
  // Top-Level App View State (defaults to landing page on initial visit)
  const [appView, setAppView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as AppView | null;
      if (
        viewParam &&
        [
          'app',
          'login',
          'signup',
          'forgot-password',
          'reset-password',
          'verify',
          'landing',
        ].includes(viewParam)
      ) {
        return viewParam;
      }
    }
    return 'landing';
  });
  const [authEmail, setAuthEmail] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavigationItem>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Workspace Data
  const [goals, setGoals] = useState<Goal[]>(() => {
    return loadStoredGoals();
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    return loadStoredNotes();
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    return loadStoredCategories();
  });
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() => loadStoredPreferences());

  // Deep-linking Category filter for navigation
  const [goalCategoryFilter, setGoalCategoryFilter] = useState<string>('All');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>('All');

  // Modal States
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalInitialTargetDate, setGoalInitialTargetDate] = useState<string | null>(null);

  const [isGoalDetailModalOpen, setIsGoalDetailModalOpen] = useState(false);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);

  const [isGoalDeleteModalOpen, setIsGoalDeleteModalOpen] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [isNoteDetailModalOpen, setIsNoteDetailModalOpen] = useState(false);
  const [detailNote, setDetailNote] = useState<Note | null>(null);

  const [isNoteDeleteModalOpen, setIsNoteDeleteModalOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  // Category Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isCategoryDetailModalOpen, setIsCategoryDetailModalOpen] = useState(false);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);

  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Transient Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Synchronize theme & persist preferences
  useEffect(() => {
    applyTheme(preferences.theme);
    if (preferences.theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
  }, [preferences]);

  // Load Cloud Workspace Data from Supabase with clear error state and retry support
  const loadCloudWorkspace = useCallback(async (user: AuthUser) => {
    setIsDataLoading(true);
    setCloudError(null);
    try {
      // Fetch only the authenticated user's cloud data. Legacy guest/fixture
      // browser records are intentionally not migrated into the account.
      const [cloudCats, cloudGoals, cloudNotes, cloudPrefs] = await Promise.all([
        fetchCategories(),
        fetchGoals(),
        fetchNotes(),
        fetchPreferences(),
      ]);

      setCategories(cloudCats);
      setGoals(cloudGoals);
      setNotes(cloudNotes);
      if (cloudPrefs) {
        setPreferences(cloudPrefs);
        applyTheme(cloudPrefs.theme);
      }
      setCloudError(null);
    } catch (err) {
      console.error('Failed to load user workspace data from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Could not sync workspace data with cloud.';
      setCloudError(msg);
      addToast(msg, 'error');
    } finally {
      setIsDataLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;

    const applySession = (session: Awaited<ReturnType<typeof getActiveSession>>) => {
      if (!isMounted) return;
      if (session) {
        setCurrentUser(session.user);
        setAuthStatus('authenticated');
        void loadCloudWorkspace(session.user);
      } else {
        setCurrentUser(null);
        setAuthStatus('unauthenticated');
      }
    };

    void getActiveSession().then(applySession);
    const authSubscription = subscribeToAuthChanges((session) => applySession(session));

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
    };
  }, [loadCloudWorkspace]);

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setAuthStatus('unauthenticated');
    setCloudError(null);
    clearWorkspaceData();
    setGoals([]);
    setNotes([]);
    setCategories([]);
    setPreferences(DEFAULT_PREFERENCES);
    setAppView('landing');
    addToast('Signed out of Bucket', 'info');
  };

  const handleUpdatePreferences = async (updated: Partial<WorkspacePreferences>) => {
    const next = { ...preferences, ...updated };
    setPreferences(next);
    applyTheme(next.theme);

    if (currentUser) {
      try {
        await upsertPreferences(next);
        addToast('Preferences saved');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to save preferences to cloud', 'error');
      }
    }
  };

  // Derived Metrics & Collections
  const metrics = useMemo(() => calculateMetrics(goals), [goals]);
  const upcomingGoals = useMemo(() => getUpcomingGoals(goals), [goals]);
  const recentGoals = useMemo(() => sortRecentlyUpdated(goals), [goals]);
  const recentNotes = useMemo(() => sortRecentlyUpdated(notes), [notes]);
  const scheduledGoalCount = useMemo(
    () => goals.filter((g) => Boolean(g.targetDate && g.targetDate.trim() && parseYmdDate(g.targetDate))).length,
    [goals]
  );

  const isAnyOtherModalOpen =
    isGoalModalOpen ||
    isGoalDetailModalOpen ||
    isGoalDeleteModalOpen ||
    isNoteModalOpen ||
    isNoteDetailModalOpen ||
    isNoteDeleteModalOpen ||
    isCategoryModalOpen ||
    isCategoryDetailModalOpen ||
    isCategoryDeleteModalOpen;

  // Global Shortcut: Cmd+K / Ctrl+K and '/' to toggle Global Search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
        return;
      }

      // 2. Forward slash '/' opens search when not actively typing and no other modal is open
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isGlobalSearchOpen &&
        !isAnyOtherModalOpen
      ) {
        const activeElement = document.activeElement;
        const tag = activeElement?.tagName?.toLowerCase();
        const isEditable = (activeElement as HTMLElement)?.isContentEditable;
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !isEditable) {
          e.preventDefault();
          setIsGlobalSearchOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isGlobalSearchOpen, isAnyOtherModalOpen]);

  // Global Search Result Handlers with fresh data resolution
  const handleSelectGoalFromSearch = (goal: Goal) => {
    setIsGlobalSearchOpen(false);
    const freshGoal = goals.find((g) => g.id === goal.id) || goal;
    setDetailGoal(freshGoal);
    setIsGoalDetailModalOpen(true);
  };

  const handleSelectNoteFromSearch = (note: Note) => {
    setIsGlobalSearchOpen(false);
    setCurrentTab('notes');
    const freshNote = notes.find((n) => n.id === note.id) || note;
    setDetailNote(freshNote);
    setIsNoteDetailModalOpen(true);
  };

  const handleSelectCategoryFromSearch = (category: Category) => {
    setIsGlobalSearchOpen(false);
    setCurrentTab('categories');
    const freshCat = categories.find((c) => c.id === category.id) || category;
    setDetailCategory(freshCat);
    setIsCategoryDetailModalOpen(true);
  };

  // Goal Actions
  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setGoalInitialTargetDate(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalInitialTargetDate(null);
    setIsGoalModalOpen(true);
  };

  const handleNewGoalForDate = (dateYmd: string) => {
    setEditingGoal(null);
    setGoalInitialTargetDate(dateYmd);
    setIsGoalModalOpen(true);
  };

  const handleOpenDetailGoal = (goal: Goal) => {
    setDetailGoal(goal);
    setIsGoalDetailModalOpen(true);
  };

  const handleSaveGoal = async (goalData: {
    title: string;
    description: string;
    category: string;
    categoryId?: string | null;
    priority: GoalPriority;
    status: GoalStatus;
    targetDate: string | null;
  }) => {
    const now = new Date().toISOString();

    if (editingGoal) {
      // Edit existing
      const updatedGoal: Goal = {
        ...editingGoal,
        ...goalData,
        categoryId:
          goalData.categoryId !== undefined
            ? goalData.categoryId
            : editingGoal.categoryId || null,
        updatedAt: now,
      };

      if (currentUser) {
        try {
          const saved = await updateGoal(editingGoal.id, {
            title: goalData.title,
            description: goalData.description,
            category: goalData.category,
            categoryId: goalData.categoryId,
            priority: goalData.priority,
            status: goalData.status,
            targetDate: goalData.targetDate,
          });
          setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? saved : g)));
          if (detailGoal && detailGoal.id === editingGoal.id) {
            setDetailGoal(saved);
          }
          addToast(`Updated "${goalData.title}"`);
        } catch (err) {
          addToast(err instanceof Error ? err.message : 'Failed to update goal in cloud', 'error');
        }
      } else {
        setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? updatedGoal : g)));
        if (detailGoal && detailGoal.id === editingGoal.id) {
          setDetailGoal(updatedGoal);
        }
        addToast(`Updated "${goalData.title}"`);
      }
    } else {
      // Create new
      if (currentUser) {
        try {
          const saved = await createGoal(goalData);
          setGoals((prev) => [saved, ...prev]);
          addToast(`Created goal "${goalData.title}"`);
        } catch (err) {
          addToast(err instanceof Error ? err.message : 'Failed to create goal in cloud', 'error');
        }
      } else {
        const newGoal: Goal = {
          id: 'goal_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          ...goalData,
          categoryId: goalData.categoryId || null,
          createdAt: now,
          updatedAt: now,
        };
        setGoals((prev) => [newGoal, ...prev]);
        addToast(`Created goal "${goalData.title}"`);
      }
    }
  };

  const handleStatusChangeGoal = async (goalId: string, nextStatus: GoalStatus) => {
    const now = new Date().toISOString();
    let updatedTitle = '';

    const prevGoals = goals;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        updatedTitle = g.title;
        const updated = {
          ...g,
          status: nextStatus,
          updatedAt: now,
        };
        if (detailGoal && detailGoal.id === goalId) {
          setDetailGoal(updated);
        }
        return updated;
      })
    );

    const msg =
      nextStatus === 'Completed'
        ? `Completed "${updatedTitle}"!`
        : `Marked "${updatedTitle}" as ${nextStatus}`;
    addToast(msg);

    if (currentUser) {
      try {
        await updateGoal(goalId, { status: nextStatus });
      } catch (err) {
        setGoals(prevGoals);
        addToast(err instanceof Error ? err.message : 'Failed to update goal status', 'error');
      }
    }
  };

  const handleToggleCompleteGoal = async (goalId: string) => {
    const target = goals.find((g) => g.id === goalId);
    if (!target) return;
    const nextStatus: GoalStatus = target.status === 'Completed' ? 'In Progress' : 'Completed';
    await handleStatusChangeGoal(goalId, nextStatus);
  };

  const handlePromptDeleteGoal = (goal: Goal) => {
    setDeletingGoal(goal);
    setIsGoalDeleteModalOpen(true);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!deletingGoal) return;
    const title = deletingGoal.title;
    const goalIdToDelete = deletingGoal.id;

    const prevGoals = goals;
    const prevNotes = notes;

    // Optimistically remove from state
    setGoals((prev) => prev.filter((g) => g.id !== goalIdToDelete));
    setNotes((prev) =>
      prev.map((n) => (n.linkedGoalId === goalIdToDelete ? { ...n, linkedGoalId: null } : n))
    );

    if (detailGoal && detailGoal.id === goalIdToDelete) {
      setDetailGoal(null);
      setIsGoalDetailModalOpen(false);
    }

    setDeletingGoal(null);

    if (currentUser) {
      try {
        await deleteGoal(goalIdToDelete);
        addToast(`Deleted "${title}"`, 'info');
      } catch (err) {
        setGoals(prevGoals);
        setNotes(prevNotes);
        addToast(err instanceof Error ? err.message : 'Failed to delete goal from cloud', 'error');
      }
    } else {
      addToast(`Deleted "${title}"`, 'info');
    }
  };

  // Note Actions
  const handleOpenNewNote = () => {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (note: Note) => {
    setEditingNote(note);
    setIsNoteModalOpen(true);
  };

  const handleOpenDetailNote = (note: Note) => {
    setDetailNote(note);
    setIsNoteDetailModalOpen(true);
  };

  const handleSaveNote = async (noteData: {
    id?: string;
    title: string;
    content: string;
    isFavorite: boolean;
    linkedGoalId?: string | null;
    categoryId?: string | null;
    category?: string | null;
  }): Promise<Note | void> => {
    const now = new Date().toISOString();
    const targetId = noteData.id || editingNote?.id;

    if (targetId) {
      const existing = notes.find((n) => n.id === targetId);
      const updatedNote: Note = {
        id: targetId,
        title: noteData.title,
        content: noteData.content,
        isFavorite: noteData.isFavorite,
        linkedGoalId:
          noteData.linkedGoalId !== undefined
            ? noteData.linkedGoalId
            : existing?.linkedGoalId || null,
        categoryId:
          noteData.categoryId !== undefined
            ? noteData.categoryId
            : existing?.categoryId || null,
        category:
          noteData.category !== undefined
            ? noteData.category
            : existing?.category || null,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        tags: existing?.tags || [],
      };

      if (currentUser) {
        try {
          const saved = await updateNote(targetId, {
            title: noteData.title,
            content: noteData.content,
            isFavorite: noteData.isFavorite,
            linkedGoalId: noteData.linkedGoalId,
            categoryId: noteData.categoryId,
            category: noteData.category,
          });
          setNotes((prev) => prev.map((n) => (n.id === targetId ? saved : n)));
          if (detailNote && detailNote.id === targetId) {
            setDetailNote(saved);
          }
          addToast(`Updated note "${noteData.title}"`);
          return saved;
        } catch (err) {
          addToast(err instanceof Error ? err.message : 'Failed to update note in cloud', 'error');
          return;
        }
      } else {
        setNotes((prev) => prev.map((n) => (n.id === targetId ? updatedNote : n)));
        if (detailNote && detailNote.id === targetId) {
          setDetailNote(updatedNote);
        }
        addToast(`Updated note "${noteData.title}"`);
        return updatedNote;
      }
    } else {
      if (currentUser) {
        try {
          const saved = await createNote({
            title: noteData.title,
            content: noteData.content,
            isFavorite: noteData.isFavorite,
            linkedGoalId: noteData.linkedGoalId,
            categoryId: noteData.categoryId,
            category: noteData.category,
          });
          setNotes((prev) => [saved, ...prev]);
          addToast(`Created note "${noteData.title}"`);
          return saved;
        } catch (err) {
          addToast(err instanceof Error ? err.message : 'Failed to create note in cloud', 'error');
          return;
        }
      } else {
        const newNote: Note = {
          id: 'note_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          title: noteData.title,
          content: noteData.content,
          isFavorite: noteData.isFavorite,
          linkedGoalId: noteData.linkedGoalId || null,
          categoryId: noteData.categoryId || null,
          category: noteData.category || null,
          createdAt: now,
          updatedAt: now,
          tags: [],
        };
        setNotes((prev) => [newNote, ...prev]);
        addToast(`Created note "${noteData.title}"`);
        return newNote;
      }
    }
  };

  const handleToggleFavoriteNote = async (noteId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const next = !target.isFavorite;

    const prevNotes = notes;
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        const updated = {
          ...n,
          isFavorite: next,
          updatedAt: new Date().toISOString(),
        };
        if (detailNote && detailNote.id === noteId) {
          setDetailNote(updated);
        }
        return updated;
      })
    );

    if (currentUser) {
      try {
        await updateNote(noteId, { isFavorite: next });
      } catch (err) {
        setNotes(prevNotes);
        addToast(err instanceof Error ? err.message : 'Failed to update note favorite', 'error');
      }
    }
  };

  const handlePromptDeleteNote = (note: Note) => {
    setDeletingNote(note);
    setIsNoteDeleteModalOpen(true);
  };

  const handleConfirmDeleteNote = async () => {
    if (!deletingNote) return;
    const title = deletingNote.title;
    const noteIdToDelete = deletingNote.id;

    const prevNotes = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteIdToDelete));

    if (detailNote && detailNote.id === noteIdToDelete) {
      setDetailNote(null);
      setIsNoteDetailModalOpen(false);
    }

    setDeletingNote(null);

    if (currentUser) {
      try {
        await deleteNote(noteIdToDelete);
        addToast(`Deleted note "${title}"`, 'info');
      } catch (err) {
        setNotes(prevNotes);
        addToast(err instanceof Error ? err.message : 'Failed to delete note from cloud', 'error');
      }
    } else {
      addToast(`Deleted note "${title}"`, 'info');
    }
  };

  // Category Actions
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleOpenDetailCategory = (category: Category) => {
    setDetailCategory(category);
    setIsCategoryDetailModalOpen(true);
  };

  const handlePromptDeleteCategory = (category: Category) => {
    setDeletingCategory(category);
    setIsCategoryDeleteModalOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    const catToDelete = deletingCategory;
    const catNameLower = catToDelete.name.toLowerCase().trim();

    // 1. Remove category from categories collection
    setCategories((prev) => prev.filter((c) => c.id !== catToDelete.id));

    // 2. Clear category association from goals without deleting the goal
    setGoals((prev) =>
      prev.map((g) => {
        if (
          g.categoryId === catToDelete.id ||
          (g.category && g.category.toLowerCase().trim() === catNameLower)
        ) {
          return {
            ...g,
            categoryId: null,
            category: '',
            updatedAt: new Date().toISOString(),
          };
        }
        return g;
      })
    );

    // 3. Clear category association from notes without deleting the note
    setNotes((prev) =>
      prev.map((n) => {
        if (
          n.categoryId === catToDelete.id ||
          (n.category && n.category.toLowerCase().trim() === catNameLower)
        ) {
          return {
            ...n,
            categoryId: null,
            category: null,
            updatedAt: new Date().toISOString(),
          };
        }
        return n;
      })
    );

    // Keep active detail views synchronized if open
    if (
      detailGoal &&
      (detailGoal.categoryId === catToDelete.id ||
        (detailGoal.category && detailGoal.category.toLowerCase().trim() === catNameLower))
    ) {
      setDetailGoal({
        ...detailGoal,
        categoryId: null,
        category: '',
        updatedAt: new Date().toISOString(),
      });
    }

    if (
      detailNote &&
      (detailNote.categoryId === catToDelete.id ||
        (detailNote.category && detailNote.category.toLowerCase().trim() === catNameLower))
    ) {
      setDetailNote({
        ...detailNote,
        categoryId: null,
        category: null,
        updatedAt: new Date().toISOString(),
      });
    }

    // Reset active category filters if pointing to the deleted category
    if (goalCategoryFilter.toLowerCase().trim() === catNameLower) {
      setGoalCategoryFilter('All');
    }
    if (noteCategoryFilter.toLowerCase().trim() === catNameLower) {
      setNoteCategoryFilter('All');
    }

    if (detailCategory && detailCategory.id === catToDelete.id) {
      setDetailCategory(null);
      setIsCategoryDetailModalOpen(false);
    }

    setDeletingCategory(null);
    setIsCategoryDeleteModalOpen(false);

    if (currentUser) {
      try {
        await deleteCategory(catToDelete.id);
        addToast(`Deleted category "${catToDelete.name}"`, 'info');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to delete category from cloud', 'error');
      }
    } else {
      addToast(`Deleted category "${catToDelete.name}"`, 'info');
    }
  };

  const handleSaveCategory = async (categoryData: {
    id?: string;
    name: string;
    color: string;
  }) => {
    const now = new Date().toISOString();
    const trimmedName = categoryData.name.trim();

    if (categoryData.id) {
      const targetId = categoryData.id;
      const prevCat = categories.find((c) => c.id === targetId);
      const oldNameLower = prevCat ? prevCat.name.toLowerCase().trim() : '';

      const updatedCat: Category = {
        id: targetId,
        name: trimmedName,
        color: categoryData.color,
        createdAt: prevCat ? prevCat.createdAt : now,
        updatedAt: now,
      };

      if (currentUser) {
        try {
          const saved = await updateCategory(targetId, {
            name: trimmedName,
            color: categoryData.color,
          });
          setCategories((prev) => prev.map((c) => (c.id === targetId ? saved : c)));
        } catch (err) {
          addToast(err instanceof Error ? err.message : 'Failed to update category in cloud', 'error');
          return;
        }
      } else {
        setCategories((prev) => prev.map((c) => (c.id === targetId ? updatedCat : c)));
      }

      // If category name changed, cascade update to associated goals and notes
      if (oldNameLower && oldNameLower !== trimmedName.toLowerCase().trim()) {
        setGoals((prev) =>
          prev.map((g) => {
            if (
              g.categoryId === targetId ||
              (g.category && g.category.toLowerCase().trim() === oldNameLower)
            ) {
              return {
                ...g,
                category: trimmedName,
                categoryId: targetId,
                updatedAt: now,
              };
            }
            return g;
          })
        );

        setNotes((prev) =>
          prev.map((n) => {
            if (
              n.categoryId === targetId ||
              (n.category && n.category.toLowerCase().trim() === oldNameLower)
            ) {
              return {
                ...n,
                category: trimmedName,
                categoryId: targetId,
                updatedAt: now,
              };
            }
            return n;
          })
        );

        // Keep active detail views in sync
        if (
          detailGoal &&
          (detailGoal.categoryId === targetId ||
            (detailGoal.category && detailGoal.category.toLowerCase().trim() === oldNameLower))
        ) {
          setDetailGoal({
            ...detailGoal,
            category: trimmedName,
            categoryId: targetId,
            updatedAt: now,
          });
        }

        if (
          detailNote &&
          (detailNote.categoryId === targetId ||
            (detailNote.category && detailNote.category.toLowerCase().trim() === oldNameLower))
        ) {
          setDetailNote({
            ...detailNote,
            category: trimmedName,
            categoryId: targetId,
            updatedAt: now,
          });
        }

        // Update active screen filters to new name
        if (goalCategoryFilter.toLowerCase().trim() === oldNameLower) {
          setGoalCategoryFilter(trimmedName);
        }
        if (noteCategoryFilter.toLowerCase().trim() === oldNameLower) {
          setNoteCategoryFilter(trimmedName);
        }
      }

      if (detailCategory && detailCategory.id === targetId) {
        setDetailCategory(updatedCat);
      }

      addToast(`Updated category "${trimmedName}"`);
    } else {
      if (currentUser) {
        try {
          const saved = await createCategory({
            name: trimmedName,
            color: categoryData.color,
          });
          setCategories((prev) => [saved, ...prev]);
          addToast(`Created category "${trimmedName}"`);
        } catch (err) {
          addToast(err instanceof Error ? err.message : 'Failed to create category in cloud', 'error');
        }
      } else {
        const newCat: Category = {
          id: 'cat_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
          name: trimmedName,
          color: categoryData.color,
          createdAt: now,
          updatedAt: now,
        };

        setCategories((prev) => [newCat, ...prev]);
        addToast(`Created category "${trimmedName}"`);
      }
    }
  };

  const handleNavigateGoalsWithCategory = (categoryName: string) => {
    setGoalCategoryFilter(categoryName);
    setCurrentTab('bucket-list');
  };

  const handleNavigateNotesWithCategory = (categoryName: string) => {
    setNoteCategoryFilter(categoryName);
    setCurrentTab('notes');
  };

  // Associated counts for deletingCategory
  const deletingCategoryCounts = useMemo(() => {
    if (!deletingCategory) return { goalCount: 0, noteCount: 0 };
    const catNameLower = deletingCategory.name.toLowerCase().trim();
    const goalCount = goals.filter(
      (g) =>
        g.categoryId === deletingCategory.id ||
        (g.category && g.category.toLowerCase().trim() === catNameLower)
    ).length;
    const noteCount = notes.filter(
      (n) =>
        n.categoryId === deletingCategory.id ||
        (n.category && n.category.toLowerCase().trim() === catNameLower)
    ).length;
    return { goalCount, noteCount };
  }, [deletingCategory, goals, notes]);

  const handleClearWorkspace = () => {
    clearWorkspaceData();
    setGoals([]);
    setNotes([]);
    setCategories([]);
    setDetailGoal(null);
    setIsGoalDetailModalOpen(false);
    setDetailNote(null);
    setIsNoteDetailModalOpen(false);
    setDetailCategory(null);
    setIsCategoryDetailModalOpen(false);
    addToast('Cleared workspace data', 'info');
  };

  // Render Landing Page View
  if (appView === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={() => setAppView('signup')}
          onLogin={() => setAppView('login')}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Render Authentication Views (Login, Sign Up, Forgot Password, Reset Password)
  if (
    appView === 'login' ||
    appView === 'signup' ||
    appView === 'forgot-password' ||
    appView === 'reset-password'
  ) {
    return (
      <>
        <AuthPage
          initialView={
            appView === 'signup'
              ? 'signup'
              : appView === 'forgot-password'
              ? 'forgot-password'
              : appView === 'reset-password'
              ? 'reset-password'
              : 'login'
          }
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthStatus('authenticated');
            setAppView('app');
            void loadCloudWorkspace(user);
            addToast(`Welcome, ${user.name || user.email}!`, 'success');
          }}
          onBackToLanding={() => setAppView('landing')}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Render OTP / Magic Link Verification View if directly requested
  if (appView === 'verify') {
    return (
      <>
        <VerificationPage
          email={authEmail || 'user@example.com'}
          onBackToLogin={() => setAppView('login')}
          onBackToLanding={() => setAppView('landing')}
          onVerifySuccess={() => {
            setAppView('app');
            addToast('Welcome to Bucket! Workspace is ready.', 'success');
          }}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Session Check Screen if directly visiting the app before auth check completes
  if (authStatus === 'checking' && appView === 'app') {
    return (
      <div className="min-h-screen bg-[#FDFDFE] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#191927] text-white flex items-center justify-center mb-4 shadow-xs">
          <svg
            className="w-5 h-5 text-white animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-[#191927]">Connecting to Bucket...</h2>
        <p className="text-xs text-[#646477] mt-1">Restoring your workspace session</p>
      </div>
    );
  }

  if (appView === 'app' && authStatus === 'unauthenticated') {
    return (
      <>
        <AuthPage
          initialView="login"
          onSuccess={(user) => {
            setCurrentUser(user);
            setAuthStatus('authenticated');
            setAppView('app');
            void loadCloudWorkspace(user);
            addToast(`Welcome, ${user.name || user.email}!`, 'success');
          }}
          onBackToLanding={() => setAppView('landing')}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Render Full Workspace View
  return (
    <AppShell
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
      onNewGoal={handleOpenNewGoal}
      onNewNote={handleOpenNewNote}
      goalCount={goals.length}
      noteCount={notes.length}
      categoryCount={categories.length}
      scheduledGoalCount={scheduledGoalCount}
      onNavigateToLanding={() => setAppView('landing')}
      currentUser={currentUser}
      onSignOut={handleSignOut}
    >
      {currentUser && isDataLoading && (
        <div className="bg-[#FAFAFC] border-b border-[#E8E8EE] px-4 py-2 text-xs text-[#646477] flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#08C83D] animate-ping" />
          <span>Synchronizing workspace with Supabase cloud...</span>
        </div>
      )}
      {currentUser && cloudError && (
        <div className="bg-[#FFF4F2] border-b border-[#FDDAD7] px-4 py-3 text-xs text-[#BC1C24] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Cloud Sync Error:</span>
            <span>{cloudError}</span>
          </div>
          <button
            type="button"
            onClick={() => currentUser && loadCloudWorkspace(currentUser)}
            disabled={isDataLoading}
            className="px-3 py-1 bg-white border border-[#FDDAD7] hover:bg-[#FDECEB] text-[#BC1C24] font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDataLoading ? 'Retrying...' : 'Retry Connection'}
          </button>
        </div>
      )}
      {currentTab === 'dashboard' ? (
        <DashboardScreen
          goals={goals}
          notes={notes}
          metrics={metrics}
          upcomingGoals={upcomingGoals}
          recentGoals={recentGoals}
          recentNotes={recentNotes}
          onNewGoal={handleOpenNewGoal}
          onNewNote={handleOpenNewNote}
          onOpenDetails={handleOpenDetailGoal}
          onEditGoal={handleOpenEditGoal}
          onToggleComplete={handleToggleCompleteGoal}
          onDeleteGoal={handlePromptDeleteGoal}
          onEditNote={handleOpenEditNote}
          onDeleteNote={handlePromptDeleteNote}
          onToggleFavoriteNote={handleToggleFavoriteNote}
          onExploreBucketList={() => setCurrentTab('bucket-list')}
          onExploreNotes={() => setCurrentTab('notes')}
          searchQuery={searchQuery}
        />
      ) : currentTab === 'agent' ? (
        <AgentScreen
          onRefreshWorkspace={async () => {
            if (currentUser) await loadCloudWorkspace(currentUser);
          }}
        />
      ) : currentTab === 'bucket-list' ? (
        <BucketListScreen
          goals={goals}
          metrics={metrics}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewGoal={handleOpenNewGoal}
          onOpenDetails={handleOpenDetailGoal}
          onEditGoal={handleOpenEditGoal}
          onToggleComplete={handleToggleCompleteGoal}
          onDeleteGoal={handlePromptDeleteGoal}
          categories={categories}
          initialCategoryFilter={goalCategoryFilter}
        />
      ) : currentTab === 'notes' ? (
        <NotesScreen
          notes={notes}
          goals={goals}
          categories={categories}
          initialCategoryFilter={noteCategoryFilter}
          initialViewMode={preferences.defaultNotesView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewNote={handleOpenNewNote}
          onEditNote={handleOpenEditNote}
          onDeleteNote={handlePromptDeleteNote}
          onToggleFavorite={handleToggleFavoriteNote}
          onSaveNote={handleSaveNote}
          onOpenDetails={handleOpenDetailNote}
        />
      ) : currentTab === 'categories' ? (
        <CategoriesScreen
          categories={categories}
          goals={goals}
          notes={notes}
          onNewCategory={handleOpenNewCategory}
          onEditCategory={handleOpenEditCategory}
          onDeleteCategory={handlePromptDeleteCategory}
          onOpenDetails={handleOpenDetailCategory}
          onNavigateGoalsWithCategory={handleNavigateGoalsWithCategory}
          onNavigateNotesWithCategory={handleNavigateNotesWithCategory}
        />
      ) : currentTab === 'calendar' ? (
        <CalendarScreen
          goals={goals}
          categories={categories}
          onOpenGoalDetails={handleOpenDetailGoal}
          onEditGoal={handleOpenEditGoal}
          onToggleCompleteGoal={handleToggleCompleteGoal}
          onNewGoalForDate={handleNewGoalForDate}
          initialViewMode={preferences.defaultCalendarView}
        />
      ) : currentTab === 'analytics' ? (
        <AnalyticsScreen
          goals={goals}
          categories={categories}
          onOpenGoalDetails={handleOpenDetailGoal}
          onNewGoal={handleOpenNewGoal}
          onNavigateGoalsWithCategory={handleNavigateGoalsWithCategory}
        />
      ) : currentTab === 'settings' ? (
        <SettingsScreen
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          goalCount={goals.length}
          noteCount={notes.length}
          categoryCount={categories.length}
          onClearWorkspaceData={handleClearWorkspace}
        />
      ) : (
        <ComingSoonView
          section={currentTab}
          onNavigateDashboard={() => setCurrentTab('dashboard')}
          onNewGoal={handleOpenNewGoal}
          onNewNote={handleOpenNewNote}
          goals={goals}
          notes={notes}
        />
      )}

      {/* Goal Creation / Edit Dialog */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalInitialTargetDate(null);
        }}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
        initialTargetDate={goalInitialTargetDate}
        categories={categories}
        onOpenManageCategories={() => {
          setIsGoalModalOpen(false);
          setCurrentTab('categories');
        }}
      />

      {/* Goal Detail View Dialog */}
      <GoalDetailModal
        isOpen={isGoalDetailModalOpen}
        onClose={() => setIsGoalDetailModalOpen(false)}
        goal={detailGoal}
        categories={categories}
        onEdit={(goal) => {
          setIsGoalDetailModalOpen(false);
          handleOpenEditGoal(goal);
        }}
        onDelete={(goal) => {
          setIsGoalDetailModalOpen(false);
          handlePromptDeleteGoal(goal);
        }}
        onStatusChange={handleStatusChangeGoal}
      />

      {/* Goal Delete Confirmation Dialog */}
      <GoalDeleteModal
        isOpen={isGoalDeleteModalOpen}
        onClose={() => setIsGoalDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteGoal}
        goal={deletingGoal}
      />

      {/* Note Creation / Edit Dialog */}
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
        goals={goals}
        categories={categories}
      />

      {/* Note Detail View Dialog */}
      <NoteDetailModal
        isOpen={isNoteDetailModalOpen}
        onClose={() => setIsNoteDetailModalOpen(false)}
        note={detailNote}
        goals={goals}
        onEdit={(note) => {
          setIsNoteDetailModalOpen(false);
          handleOpenEditNote(note);
        }}
        onDelete={(note) => {
          setIsNoteDetailModalOpen(false);
          handlePromptDeleteNote(note);
        }}
        onToggleFavorite={handleToggleFavoriteNote}
        onUpdateContent={(noteId, updatedContent) => {
          if (!detailNote) return;
          const updatedNote = {
            ...detailNote,
            content: updatedContent,
          };
          setDetailNote(updatedNote);
          handleSaveNote({
            id: noteId,
            title: detailNote.title,
            content: updatedContent,
            isFavorite: detailNote.isFavorite,
            linkedGoalId: detailNote.linkedGoalId,
            categoryId: detailNote.categoryId,
            category: detailNote.category,
          });
        }}
      />

      {/* Note Delete Confirmation Dialog */}
      <NoteDeleteModal
        isOpen={isNoteDeleteModalOpen}
        onClose={() => setIsNoteDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteNote}
        note={deletingNote}
      />

      {/* Category Creation / Edit Dialog */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
        existingCategories={categories}
      />

      {/* Category Detail View Dialog */}
      <CategoryDetailModal
        isOpen={isCategoryDetailModalOpen}
        onClose={() => setIsCategoryDetailModalOpen(false)}
        category={detailCategory}
        goals={goals}
        notes={notes}
        onEditCategory={handleOpenEditCategory}
        onNavigateGoalsWithCategory={handleNavigateGoalsWithCategory}
        onNavigateNotesWithCategory={handleNavigateNotesWithCategory}
        onOpenGoalDetails={handleOpenDetailGoal}
        onOpenNoteDetails={handleOpenDetailNote}
      />

      {/* Category Delete Confirmation Dialog */}
      <CategoryDeleteModal
        isOpen={isCategoryDeleteModalOpen}
        onClose={() => setIsCategoryDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteCategory}
        category={deletingCategory}
        associatedGoalsCount={deletingCategoryCounts.goalCount}
        associatedNotesCount={deletingCategoryCounts.noteCount}
      />

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        goals={goals}
        notes={notes}
        categories={categories}
        onSelectGoal={handleSelectGoalFromSearch}
        onSelectNote={handleSelectNoteFromSearch}
        onSelectCategory={handleSelectCategoryFromSearch}
        onNavigateGoalsWithCategory={handleNavigateGoalsWithCategory}
        onNavigateNotesWithCategory={handleNavigateNotesWithCategory}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}
