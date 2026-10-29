export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed';

export type GoalPriority = 'Low' | 'Medium' | 'High';

export type GoalSortOption =
  | 'recently-updated'
  | 'date-added'
  | 'target-date'
  | 'alphabetical'
  | 'priority';

export type NoteSortOption =
  | 'recently-updated'
  | 'oldest-updated'
  | 'alphabetical-asc'
  | 'alphabetical-desc';

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId?: string | null;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  linkedGoalId?: string | null;
  categoryId?: string | null;
  category?: string | null;
  tags?: string[];
}

export interface OverviewMetrics {
  totalGoals: number;
  inProgress: number;
  completed: number;
  completionRate: number; // 0 to 100
}

export type NavigationItem =
  | 'dashboard'
  | 'agent'
  | 'bucket-list'
  | 'notes'
  | 'categories'
  | 'calendar'
  | 'analytics'
  | 'settings';
