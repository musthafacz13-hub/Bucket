import React, { useState, useMemo, useEffect } from 'react';
import { Goal, GoalStatus, GoalPriority, GoalSortOption, OverviewMetrics, Category } from '../../types';
import { filterGoals, sortGoals, getAvailableCategories } from '../../utils/calculations';
import { BucketListSummary } from './BucketListSummary';
import { BucketListToolbar } from './BucketListToolbar';
import { BucketListTable } from './BucketListTable';
import { Plus } from 'lucide-react';

interface BucketListScreenProps {
  goals: Goal[];
  metrics: OverviewMetrics;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNewGoal: () => void;
  onOpenDetails: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onToggleComplete: (goalId: string) => void;
  onDeleteGoal: (goal: Goal) => void;
  categories?: Category[];
  initialCategoryFilter?: string;
}

export const BucketListScreen: React.FC<BucketListScreenProps> = ({
  goals,
  metrics,
  searchQuery,
  onSearchChange,
  onNewGoal,
  onOpenDetails,
  onEditGoal,
  onToggleComplete,
  onDeleteGoal,
  categories = [],
  initialCategoryFilter,
}) => {
  // Filter and Sort states
  const [internalSearch, setInternalSearch] = useState('');
  const activeSearch = searchQuery !== undefined ? searchQuery : internalSearch;
  const handleSearchChange = onSearchChange || setInternalSearch;

  const [statusFilter, setStatusFilter] = useState<'All' | GoalStatus>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter || 'All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | GoalPriority>('All');
  const [sortOption, setSortOption] = useState<GoalSortOption>('recently-updated');

  // Keep category filter in sync if navigated with a specific category
  useEffect(() => {
    if (initialCategoryFilter !== undefined) {
      setCategoryFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Compute available categories from goals & defined categories
  const availableCategories = useMemo(
    () => getAvailableCategories(goals, categories),
    [goals, categories]
  );

  // Combined filter pipeline
  const filteredGoals = useMemo(() => {
    return filterGoals(goals, {
      searchQuery: activeSearch,
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
    });
  }, [goals, activeSearch, statusFilter, categoryFilter, priorityFilter]);

  // Deterministic sorting
  const sortedAndFilteredGoals = useMemo(() => {
    return sortGoals(filteredGoals, sortOption);
  }, [filteredGoals, sortOption]);

  const hasActiveFilters =
    Boolean(activeSearch) ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    priorityFilter !== 'All';

  const handleClearFilters = () => {
    handleSearchChange('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setPriorityFilter('All');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* 4. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191927]">
            Bucket List
          </h1>
          <p className="text-xs sm:text-sm text-[#646477] mt-0.5">
            Keep track of the things you want to do, learn, and experience.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewGoal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] active:bg-[#141420] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927] self-start sm:self-auto min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* 5. Goal Summary */}
      <BucketListSummary metrics={metrics} />

      {/* 6. Search and Filter Toolbar */}
      <BucketListToolbar
        searchQuery={activeSearch}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        availableCategories={availableCategories}
        totalCount={goals.length}
        filteredCount={sortedAndFilteredGoals.length}
        onClearFilters={handleClearFilters}
      />

      {/* 7. Goal List Table / Mobile List */}
      <BucketListTable
        goals={sortedAndFilteredGoals}
        totalCollectionCount={goals.length}
        statusFilter={statusFilter}
        isSearching={Boolean(activeSearch)}
        hasActiveFilters={hasActiveFilters}
        onNewGoal={onNewGoal}
        onOpenDetails={onOpenDetails}
        onEditGoal={onEditGoal}
        onToggleComplete={onToggleComplete}
        onDeleteGoal={onDeleteGoal}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
};
