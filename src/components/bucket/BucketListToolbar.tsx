import React from 'react';
import { GoalStatus, GoalPriority, GoalSortOption } from '../../types';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface BucketListToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'All' | GoalStatus;
  onStatusFilterChange: (status: 'All' | GoalStatus) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  priorityFilter: 'All' | GoalPriority;
  onPriorityFilterChange: (priority: 'All' | GoalPriority) => void;
  sortOption: GoalSortOption;
  onSortOptionChange: (sort: GoalSortOption) => void;
  availableCategories: string[];
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
}

export const BucketListToolbar: React.FC<BucketListToolbarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  sortOption,
  onSortOptionChange,
  availableCategories,
  totalCount,
  filteredCount,
  onClearFilters,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== 'All' ||
    categoryFilter !== 'All' ||
    priorityFilter !== 'All';

  const statusOptions: Array<'All' | GoalStatus> = [
    'All',
    'Not Started',
    'In Progress',
    'Completed',
  ];

  return (
    <div className="bg-white border border-[#E8E8EE] rounded-xl p-4 space-y-3.5">
      {/* Top Row: Search and Status Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <label htmlFor="bucket-search" className="sr-only">
            Search your goals
          </label>
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8EA0] pointer-events-none" />
          <input
            id="bucket-search"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search your goals..."
            className="w-full pl-8 pr-8 py-2 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:bg-white transition-all placeholder:text-[#8E8EA0]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8E8EA0] hover:text-[#191927] rounded"
              aria-label="Clear search query"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Segmented Control */}
        <div
          className="flex items-center gap-1 p-0.5 bg-[#F3F3F7] rounded-lg overflow-x-auto self-start md:self-auto max-w-full"
          role="tablist"
          aria-label="Filter goals by status"
        >
          {statusOptions.map((opt) => {
            const isSelected = statusFilter === opt;
            const label = opt === 'All' ? 'All Goals' : opt;

            return (
              <button
                key={opt}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onStatusFilterChange(opt)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-white text-[#191927] shadow-xs font-semibold'
                    : 'text-[#646477] hover:text-[#191927]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Category, Priority, Sorting, Result Count, and Clear Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0F0F4]">
        {/* Dropdown Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="category-select" className="sr-only">
              Filter by Category
            </label>
            <select
              id="category-select"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="px-2.5 py-1.5 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg hover:border-[#191927]/40 focus:outline-none focus:border-[#191927] transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Unassigned">Unassigned</option>
              {availableCategories
                .filter((cat) => cat.toLowerCase() !== 'unassigned')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="priority-select" className="sr-only">
              Filter by Priority
            </label>
            <select
              id="priority-select"
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value as 'All' | GoalPriority)}
              className="px-2.5 py-1.5 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg hover:border-[#191927]/40 focus:outline-none focus:border-[#191927] transition-all"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="sort-select" className="sr-only">
              Sort goals by
            </label>
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3 h-3 absolute left-2 text-[#8E8EA0] pointer-events-none" />
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => onSortOptionChange(e.target.value as GoalSortOption)}
                className="pl-6 pr-2.5 py-1.5 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg hover:border-[#191927]/40 focus:outline-none focus:border-[#191927] transition-all"
              >
                <option value="recently-updated">Sort: Recently Updated</option>
                <option value="date-added">Sort: Date Added</option>
                <option value="target-date">Sort: Target Date</option>
                <option value="alphabetical">Sort: Alphabetical</option>
                <option value="priority">Sort: Priority (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Count Indicator */}
        <div className="text-xs text-[#646477]">
          {hasActiveFilters ? (
            <span>
              Showing <strong className="text-[#191927] font-semibold">{filteredCount}</strong> of{' '}
              <strong className="text-[#191927] font-semibold">{totalCount}</strong> goals
            </span>
          ) : (
            <span>
              <strong className="text-[#191927] font-semibold">{totalCount}</strong> {totalCount === 1 ? 'goal' : 'goals'} total
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
