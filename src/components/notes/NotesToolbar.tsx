import React from 'react';
import { NoteSortOption } from '../../types';
import { Search, X, Star, LayoutGrid, List, ArrowUpDown } from 'lucide-react';

interface NotesToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (favOnly: boolean) => void;
  sortOption: NoteSortOption;
  onSortOptionChange: (option: NoteSortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalNotes: number;
  filteredNotesCount: number;
  onClearFilters: () => void;
  categories?: { id: string; name: string; color: string }[];
  categoryFilter?: string;
  onCategoryFilterChange?: (cat: string) => void;
}

export const NotesToolbar: React.FC<NotesToolbarProps> = ({
  searchQuery,
  onSearchChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  sortOption,
  onSortOptionChange,
  viewMode,
  onViewModeChange,
  totalNotes,
  filteredNotesCount,
  onClearFilters,
  categories = [],
  categoryFilter = 'All',
  onCategoryFilterChange,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) || favoritesOnly || (categoryFilter && categoryFilter !== 'All');

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E8E8EE] space-y-3">
      {/* Top Row: Search and View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8EA0] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full pl-8 pr-7 py-1.5 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:bg-white transition-all placeholder:text-[#8E8EA0]"
            aria-label="Search notes"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8EA0] hover:text-[#191927] p-0.5"
              aria-label="Clear search text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher & Result Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs text-[#646477] tabular-nums">
            {filteredNotesCount === totalNotes
              ? `${totalNotes} ${totalNotes === 1 ? 'note' : 'notes'}`
              : `Showing ${filteredNotesCount} of ${totalNotes}`}
          </span>

          <div
            className="inline-flex items-center p-0.5 bg-[#F3F3F7] rounded-lg border border-[#E8E8EE]"
            role="group"
            aria-label="View layout switch"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-white text-[#191927] shadow-xs'
                  : 'text-[#646477] hover:text-[#191927]'
              }`}
              title="Cards grid view"
              aria-pressed={viewMode === 'grid'}
              aria-label="Cards grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-[#191927] shadow-xs'
                  : 'text-[#646477] hover:text-[#191927]'
              }`}
              title="List table view"
              aria-pressed={viewMode === 'list'}
              aria-label="List table view"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Filter Tabs, Sort, and Clear */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F0F4]">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onFavoritesOnlyChange(false)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors min-h-[30px] ${
              !favoritesOnly
                ? 'bg-[#191927] text-white'
                : 'text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7]'
            }`}
          >
            All Notes
          </button>
          <button
            type="button"
            onClick={() => onFavoritesOnlyChange(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors min-h-[30px] ${
              favoritesOnly
                ? 'bg-[#191927] text-white'
                : 'text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7]'
            }`}
          >
            <Star
              className="w-3 h-3"
              fill={favoritesOnly ? '#F9E94E' : 'transparent'}
            />
            <span>Favorites</span>
          </button>

          {categories.length > 0 && onCategoryFilterChange && (
            <div className="flex items-center gap-1.5 ml-1">
              <label htmlFor="notes-category-select" className="sr-only">
                Filter by Category
              </label>
              <select
                id="notes-category-select"
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#191927] transition-all cursor-pointer min-h-[30px]"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>
          )}
        </div>

        {/* Sort Dropdown & Clear Filters */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              aria-label="Reset search and filters"
              className="inline-flex items-center gap-1 text-xs text-[#646477] hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8E8EA0]" aria-hidden="true" />
            <label htmlFor="notes-sort-select" className="sr-only">
              Sort notes
            </label>
            <select
              id="notes-sort-select"
              value={sortOption}
              onChange={(e) => onSortOptionChange(e.target.value as NoteSortOption)}
              className="text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#191927] transition-all cursor-pointer min-h-[30px]"
            >
              <option value="recently-updated">Recently Updated</option>
              <option value="oldest-updated">Oldest Updated</option>
              <option value="alphabetical-asc">Title (A → Z)</option>
              <option value="alphabetical-desc">Title (Z → A)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
