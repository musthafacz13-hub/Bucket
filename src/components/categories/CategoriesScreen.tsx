import React, { useState, useMemo } from 'react';
import { Category, Goal, Note } from '../../types';
import { calculateCategoryCounts } from '../../utils/calculations';
import { EmptyState } from '../common/EmptyState';
import {
  Tag,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Eye,
  CheckSquare,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface CategoriesScreenProps {
  categories: Category[];
  goals: Goal[];
  notes: Note[];
  onNewCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onOpenDetails: (category: Category) => void;
  onNavigateGoalsWithCategory: (categoryName: string) => void;
  onNavigateNotesWithCategory: (categoryName: string) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  categories,
  goals,
  notes,
  onNewCategory,
  onEditCategory,
  onDeleteCategory,
  onOpenDetails,
  onNavigateGoalsWithCategory,
  onNavigateNotesWithCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate real counts for all categories
  const { countsMap, unassigned } = useMemo(
    () => calculateCategoryCounts(categories, goals, notes),
    [categories, goals, notes]
  );

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  const totalCategorizedGoals = useMemo(() => {
    let count = 0;
    for (const [, val] of countsMap) {
      count += val.goalCount;
    }
    return count;
  }, [countsMap]);

  const totalCategorizedNotes = useMemo(() => {
    let count = 0;
    for (const [, val] of countsMap) {
      count += val.noteCount;
    }
    return count;
  }, [countsMap]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191927]">
            Categories
          </h1>
          <p className="text-xs sm:text-sm text-[#646477] mt-0.5">
            Manage the categories used to organize your goals and notes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onNewCategory}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] active:bg-[#141420] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927] min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Category</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Categories */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#646477] mb-2">
            <span className="text-xs font-medium">Categories</span>
            <Tag className="w-4 h-4 text-[#8E8EA0]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-[#191927] tabular-nums">
              {categories.length}
            </span>
            <span className="text-[11px] text-[#8E8EA0] ml-2">defined</span>
          </div>
        </div>

        {/* Goals Assigned */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#646477] mb-2">
            <span className="text-xs font-medium">Categorized Goals</span>
            <CheckSquare className="w-4 h-4 text-[#08C83D]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-[#191927] tabular-nums">
              {totalCategorizedGoals}
            </span>
            <span className="text-[11px] text-[#8E8EA0] ml-2">assigned</span>
          </div>
        </div>

        {/* Notes Assigned */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#646477] mb-2">
            <span className="text-xs font-medium">Categorized Notes</span>
            <FileText className="w-4 h-4 text-[#8E8EA0]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-[#191927] tabular-nums">
              {totalCategorizedNotes}
            </span>
            <span className="text-[11px] text-[#8E8EA0] ml-2">assigned</span>
          </div>
        </div>

        {/* Unassigned Items */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E8EE] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#646477] mb-2">
            <span className="text-xs font-medium">Unassigned</span>
            <span className="w-2 h-2 rounded-full bg-[#8E8EA0]" aria-hidden="true" />
          </div>
          <div className="text-xs text-[#646477] space-y-1">
            <div>
              <span className="font-semibold text-[#191927] tabular-nums">
                {unassigned.goalCount}
              </span>{' '}
              goals,{' '}
              <span className="font-semibold text-[#191927] tabular-nums">
                {unassigned.noteCount}
              </span>{' '}
              notes
            </div>
            {(unassigned.goalCount > 0 || unassigned.noteCount > 0) && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#646477] pt-0.5">
                <span className="text-[#8E8EA0]">View:</span>
                {unassigned.goalCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigateGoalsWithCategory('Unassigned')}
                    className="hover:text-[#191927] hover:underline"
                    aria-label="Filter unassigned goals in Bucket List"
                  >
                    Goals
                  </button>
                )}
                {unassigned.goalCount > 0 && unassigned.noteCount > 0 && (
                  <span aria-hidden="true" className="text-[#D0D0DC]">
                    ·
                  </span>
                )}
                {unassigned.noteCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigateNotesWithCategory('Unassigned')}
                    className="hover:text-[#191927] hover:underline"
                    aria-label="Filter unassigned notes"
                  >
                    Notes
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Categories Area */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E8EE] p-8 sm:p-12 text-center">
          <EmptyState
            icon={Tag}
            heading="No categories yet"
            description="Create categories to organize your goals and notes by areas like Travel, Fitness, Learning, or Career."
            actionLabel="Create Category"
            onAction={onNewCategory}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E8EE] overflow-hidden space-y-0">
          {/* Toolbar row: Search and count */}
          <div className="p-3 sm:p-4 border-b border-[#E8E8EE] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8EA0] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-7 py-1.5 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:bg-white transition-all placeholder:text-[#8E8EA0]"
                aria-label="Search categories"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8EA0] hover:text-[#191927] p-0.5"
                  aria-label="Clear category search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-[#646477] self-end sm:self-auto tabular-nums">
              {filteredCategories.length === categories.length
                ? `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`
                : `Showing ${filteredCategories.length} of ${categories.length}`}
            </div>
          </div>

          {/* Table / List */}
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#646477]">
              No categories match &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" aria-label="Categories table">
                <thead>
                  <tr className="border-b border-[#E8E8EE] bg-[#FAFAFC] text-[11px] font-semibold text-[#646477] uppercase tracking-wider">
                    <th scope="col" className="px-4 py-3 min-w-[160px]">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-3 text-center w-28">
                      Goals
                    </th>
                    <th scope="col" className="px-4 py-3 text-center w-28">
                      Notes
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-4 py-3 text-center w-36">
                      Quick Filter
                    </th>
                    <th scope="col" className="px-4 py-3 text-right w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E8EE]">
                  {filteredCategories.map((cat) => {
                    const counts = countsMap.get(cat.id) || { goalCount: 0, noteCount: 0 };

                    return (
                      <tr
                        key={cat.id}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onOpenDetails(cat);
                          }
                        }}
                        className="group hover:bg-[#FAFAFC] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#191927]"
                      >
                        {/* Name and Color Indicator */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => onOpenDetails(cat)}
                            className="inline-flex items-center gap-2.5 text-left group-hover:text-black focus:outline-none"
                            aria-label={`Inspect category "${cat.name}"`}
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-[#191927]/20"
                              style={{ backgroundColor: cat.color }}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold text-[#191927] hover:underline">
                              {cat.name}
                            </span>
                          </button>
                        </td>

                        {/* Associated Goals Count */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => onNavigateGoalsWithCategory(cat.name)}
                            className="inline-flex items-center justify-center gap-1 text-xs text-[#191927] hover:text-[#08C83D] font-medium tabular-nums px-2 py-0.5 rounded hover:bg-[#F3F3F7] transition-colors"
                            title={`Filter ${counts.goalCount} goals in Bucket List`}
                            aria-label={`View ${counts.goalCount} goals for category "${cat.name}"`}
                          >
                            <span>{counts.goalCount}</span>
                          </button>
                        </td>

                        {/* Associated Notes Count */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => onNavigateNotesWithCategory(cat.name)}
                            className="inline-flex items-center justify-center gap-1 text-xs text-[#191927] hover:text-[#191927] font-medium tabular-nums px-2 py-0.5 rounded hover:bg-[#F3F3F7] transition-colors"
                            title={`Filter ${counts.noteCount} notes`}
                            aria-label={`View ${counts.noteCount} notes for category "${cat.name}"`}
                          >
                            <span>{counts.noteCount}</span>
                          </button>
                        </td>

                        {/* Quick filter shortcut buttons */}
                        <td className="hidden sm:table-cell px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-1 text-[11px] text-[#646477]">
                            <button
                              type="button"
                              onClick={() => onNavigateGoalsWithCategory(cat.name)}
                              className="px-2 py-1 hover:text-[#191927] hover:bg-[#F3F3F7] rounded transition-colors inline-flex items-center gap-1"
                              title="Filter Goals"
                            >
                              <span>Goals</span>
                              <ExternalLink className="w-2.5 h-2.5 text-[#8E8EA0]" />
                            </button>
                            <span aria-hidden="true" className="text-[#D0D0DC]">
                              ·
                            </span>
                            <button
                              type="button"
                              onClick={() => onNavigateNotesWithCategory(cat.name)}
                              className="px-2 py-1 hover:text-[#191927] hover:bg-[#F3F3F7] rounded transition-colors inline-flex items-center gap-1"
                              title="Filter Notes"
                            >
                              <span>Notes</span>
                              <ExternalLink className="w-2.5 h-2.5 text-[#8E8EA0]" />
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenDetails(cat)}
                              className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded transition-colors min-h-[30px] min-w-[30px] inline-flex items-center justify-center"
                              title="Inspect content"
                              aria-label={`Inspect category "${cat.name}"`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditCategory(cat)}
                              className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded transition-colors min-h-[30px] min-w-[30px] inline-flex items-center justify-center"
                              title="Edit category"
                              aria-label={`Edit category "${cat.name}"`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCategory(cat)}
                              className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded transition-colors min-h-[30px] min-w-[30px] inline-flex items-center justify-center"
                              title="Delete category"
                              aria-label={`Delete category "${cat.name}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
