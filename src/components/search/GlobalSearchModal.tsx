import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Goal, Note, Category } from '../../types';
import { CategoryTag } from '../common/CategoryTag';
import { StatusIndicator, PriorityIndicator } from '../common/StatusIndicator';
import { formatDate, formatRelativeOrShortDate } from '../../utils/date';
import {
  Search,
  X,
  CheckSquare,
  FileText,
  Tag,
  CornerDownLeft,
  Star,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  notes: Note[];
  categories: Category[];
  onSelectGoal: (goal: Goal) => void;
  onSelectNote: (note: Note) => void;
  onSelectCategory: (category: Category) => void;
  onNavigateGoalsWithCategory?: (categoryName: string) => void;
  onNavigateNotesWithCategory?: (categoryName: string) => void;
}

type SearchFilterType = 'all' | 'goals' | 'notes' | 'categories';

type FlatSearchResult =
  | { type: 'goal'; data: Goal }
  | { type: 'note'; data: Note }
  | { type: 'category'; data: Category };

/**
 * Safe, accessible highlight component:
 * Never renders HTML, uses pure React elements with <mark> tags.
 */
export const HighlightMatch: React.FC<{
  text: string;
  query: string;
  className?: string;
}> = ({ text, query, className = '' }) => {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const trimmed = query.trim();
  try {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          if (part.toLowerCase() === trimmed.toLowerCase()) {
            return (
              <mark
                key={index}
                className="bg-[#F9E94E]/70 text-[#191927] font-semibold rounded-xs px-0.5"
              >
                {part}
              </mark>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </span>
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
};

/**
 * Extracts a contextual snippet around the matching keyword.
 */
export function getMatchingSnippet(content: string, query: string, maxLength = 110): string {
  if (!content) return '';
  if (!query || !query.trim()) {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  }
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  const idx = lowerContent.indexOf(lowerQuery);

  if (idx === -1) {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  }

  const start = Math.max(0, idx - 30);
  const end = Math.min(content.length, idx + lowerQuery.length + 50);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < content.length ? '...' : '';

  return prefix + content.slice(start, end).trim() + suffix;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  goals,
  notes,
  categories,
  onSelectGoal,
  onSelectNote,
  onSelectCategory,
  onNavigateGoalsWithCategory,
  onNavigateNotesWithCategory,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<SearchFilterType>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const isUsingKeyboardRef = useRef(false);

  // Focus management: initial focus & focus restoration
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setFilterType('all');
      setSelectedIndex(0);
      isUsingKeyboardRef.current = false;
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else if (previouslyFocusedElementRef.current) {
      if (document.contains(previouslyFocusedElementRef.current)) {
        previouslyFocusedElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Focus Trap & Global Escape Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDownListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDownListener);
    return () => window.removeEventListener('keydown', handleKeyDownListener);
  }, [isOpen, onClose]);

  // Lookup map for category resolution
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
      map.set(c.name.toLowerCase().trim(), c);
    }
    return map;
  }, [categories]);

  // Precomputed category associated counts
  const categoryCountsMap = useMemo(() => {
    const map = new Map<string, { goalCount: number; noteCount: number }>();
    for (const c of categories) {
      const nameLower = c.name.toLowerCase().trim();
      const gCount = goals.filter(
        (g) =>
          g.categoryId === c.id ||
          (g.category && g.category.toLowerCase().trim() === nameLower)
      ).length;
      const nCount = notes.filter(
        (n) =>
          n.categoryId === c.id ||
          (n.category && n.category.toLowerCase().trim() === nameLower)
      ).length;
      map.set(c.id, { goalCount: gCount, noteCount: nCount });
    }
    return map;
  }, [categories, goals, notes]);

  // Filtered matching items
  const { matchedGoals, matchedNotes, matchedCategories, totalCount } = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        matchedGoals: [],
        matchedNotes: [],
        matchedCategories: [],
        totalCount: 0,
      };
    }

    // 1. Goals matching (title, description, category, resolved category name)
    const goalsList = goals.filter((g) => {
      const matchTitle = (g.title || '').toLowerCase().includes(q);
      const matchDesc = (g.description || '').toLowerCase().includes(q);
      const matchCat = (g.category || '').toLowerCase().includes(q);
      const resolvedCatName = g.categoryId ? categoryMap.get(g.categoryId)?.name.toLowerCase() : '';
      const matchResolvedCat = Boolean(resolvedCatName && resolvedCatName.includes(q));
      return matchTitle || matchDesc || matchCat || matchResolvedCat;
    });

    // 2. Notes matching (title, content, category, tags, resolved category name)
    const notesList = notes.filter((n) => {
      const matchTitle = (n.title || '').toLowerCase().includes(q);
      const matchContent = (n.content || '').toLowerCase().includes(q);
      const matchCat = (n.category || '').toLowerCase().includes(q);
      const matchTags = (n.tags || []).some(
        (t) => typeof t === 'string' && t.toLowerCase().includes(q)
      );
      const resolvedCatName = n.categoryId ? categoryMap.get(n.categoryId)?.name.toLowerCase() : '';
      const matchResolvedCat = Boolean(resolvedCatName && resolvedCatName.includes(q));
      return matchTitle || matchContent || matchCat || matchTags || matchResolvedCat;
    });

    // 3. Categories matching (name)
    const categoriesList = categories.filter((c) => {
      return (c.name || '').toLowerCase().includes(q);
    });

    return {
      matchedGoals: goalsList,
      matchedNotes: notesList,
      matchedCategories: categoriesList,
      totalCount: goalsList.length + notesList.length + categoriesList.length,
    };
  }, [query, goals, notes, categories, categoryMap]);

  // Visible flattened items according to current filter type
  const flatItems: FlatSearchResult[] = useMemo(() => {
    const items: FlatSearchResult[] = [];

    if (filterType === 'all' || filterType === 'goals') {
      for (const g of matchedGoals) items.push({ type: 'goal', data: g });
    }
    if (filterType === 'all' || filterType === 'notes') {
      for (const n of matchedNotes) items.push({ type: 'note', data: n });
    }
    if (filterType === 'all' || filterType === 'categories') {
      for (const c of matchedCategories) items.push({ type: 'category', data: c });
    }

    return items;
  }, [filterType, matchedGoals, matchedNotes, matchedCategories]);

  // Fast O(1) index lookup map
  const itemIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    flatItems.forEach((item, idx) => {
      map.set(`${item.type}_${item.data.id}`, idx);
    });
    return map;
  }, [flatItems]);

  // Reset selected index when query or filter changes
  useEffect(() => {
    setSelectedIndex(0);
    isUsingKeyboardRef.current = false;
  }, [query, filterType]);

  // Keep selected element visible when navigating with arrow keys
  useEffect(() => {
    if (flatItems.length === 0) return;
    const activeEl = resultsContainerRef.current?.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`
    );
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, flatItems.length]);

  const handleSelectItem = (item: FlatSearchResult) => {
    if (item.type === 'goal') {
      onSelectGoal(item.data);
    } else if (item.type === 'note') {
      onSelectNote(item.data);
    } else {
      onSelectCategory(item.data);
    }
    onClose();
  };

  // Keyboard navigation for search combobox
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      if (flatItems.length > 0) {
        e.preventDefault();
        isUsingKeyboardRef.current = true;
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (flatItems.length > 0) {
        e.preventDefault();
        isUsingKeyboardRef.current = true;
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      if (flatItems.length > 0 && flatItems[selectedIndex]) {
        e.preventDefault();
        handleSelectItem(flatItems[selectedIndex]);
      }
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#191927]/40 backdrop-blur-xs flex items-start justify-center pt-10 sm:pt-16 p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Workspace Search"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[#E8E8EE] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[82vh] transition-all"
      >
        {/* Screen Reader Live Status Region */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {!query.trim()
            ? 'Search opened. Type to search across goals, notes, and categories.'
            : totalCount === 0
            ? `No results found for ${query}.`
            : `${totalCount} ${totalCount === 1 ? 'result' : 'results'} found. Use up and down arrows to navigate.`}
        </div>

        {/* Top Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-[#E8E8EE] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#8E8EA0] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={flatItems.length > 0}
            aria-controls="global-search-results-list"
            aria-activedescendant={
              flatItems.length > 0 && selectedIndex >= 0
                ? `search-result-${selectedIndex}`
                : undefined
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search goals, notes, and categories..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[#191927] placeholder:text-[#8E8EA0] focus:outline-none"
            aria-label="Search workspace content"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-[#8E8EA0] hover:text-[#191927] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
              aria-label="Clear search query"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-[#646477] bg-[#FAFAFC] hover:bg-[#F3F3F7] active:bg-[#EBEBEF] px-2 py-1 rounded border border-[#E8E8EE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
            title="Press Escape to close"
            aria-label="Close search (Escape)"
          >
            <kbd className="font-mono">ESC</kbd>
          </button>
        </div>

        {/* Filter Type Pills (Visible when results exist) */}
        {totalCount > 0 && (
          <div
            className="px-4 py-2 bg-[#FAFAFC] border-b border-[#E8E8EE] flex items-center gap-1.5 overflow-x-auto text-xs"
            role="toolbar"
            aria-label="Filter search results by category type"
          >
            <span className="text-[11px] font-semibold text-[#8E8EA0] uppercase tracking-wider mr-1 shrink-0">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                filterType === 'all'
                  ? 'bg-[#191927] text-white'
                  : 'bg-white text-[#646477] hover:text-[#191927] border border-[#E8E8EE]'
              }`}
              aria-pressed={filterType === 'all'}
            >
              All ({totalCount})
            </button>
            {matchedGoals.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterType('goals')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                  filterType === 'goals'
                    ? 'bg-[#191927] text-white'
                    : 'bg-white text-[#646477] hover:text-[#191927] border border-[#E8E8EE]'
                }`}
                aria-pressed={filterType === 'goals'}
              >
                Goals ({matchedGoals.length})
              </button>
            )}
            {matchedNotes.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterType('notes')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                  filterType === 'notes'
                    ? 'bg-[#191927] text-white'
                    : 'bg-white text-[#646477] hover:text-[#191927] border border-[#E8E8EE]'
                }`}
                aria-pressed={filterType === 'notes'}
              >
                Notes ({matchedNotes.length})
              </button>
            )}
            {matchedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterType('categories')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] ${
                  filterType === 'categories'
                    ? 'bg-[#191927] text-white'
                    : 'bg-white text-[#646477] hover:text-[#191927] border border-[#E8E8EE]'
                }`}
                aria-pressed={filterType === 'categories'}
              >
                Categories ({matchedCategories.length})
              </button>
            )}
          </div>
        )}

        {/* Results Container */}
        <div
          ref={resultsContainerRef}
          id="global-search-results-list"
          role="listbox"
          aria-label="Search results"
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 divide-y divide-[#F0F0F4]"
        >
          {/* State 1: No Query Prompt */}
          {!query.trim() && (
            <div className="py-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#FAFAFC] border border-[#E8E8EE] mx-auto flex items-center justify-center text-[#8E8EA0]">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#191927]">Quick Workspace Search</p>
                <p className="text-xs text-[#646477] max-w-sm mx-auto">
                  Type any keyword to search across goals, notes, content, tags, and categories.
                </p>
              </div>

              {/* Quick Category Suggestions */}
              {categories.length > 0 && (
                <div className="pt-3 flex items-center justify-center gap-1.5 flex-wrap max-w-md mx-auto">
                  <span className="text-[11px] text-[#8E8EA0] mr-1">Browse:</span>
                  {categories.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setQuery(c.name);
                        inputRef.current?.focus();
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-[#FAFAFC] hover:bg-[#F3F3F7] active:bg-[#EBEBEF] text-[#191927] border border-[#E8E8EE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                        aria-hidden="true"
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* State 2: Query Typed But 0 Results */}
          {query.trim() && totalCount === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#FAFAFC] border border-[#E8E8EE] mx-auto flex items-center justify-center text-[#8E8EA0]">
                <X className="w-5 h-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#191927]">
                  No results found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-[#646477]">
                  Check your spelling or try searching for another keyword or category name.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] hover:bg-[#F3F3F7] active:bg-[#EBEBEF] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
              >
                Clear query
              </button>
            </div>
          )}

          {/* State 3: Display Grouped Results */}
          {query.trim() && flatItems.length > 0 && (
            <div className="space-y-4 pt-1">
              {/* Group A: Goals */}
              {(filterType === 'all' || filterType === 'goals') && matchedGoals.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#646477] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-[#08C83D]" aria-hidden="true" />
                      <span>Goals ({matchedGoals.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {matchedGoals.map((goal) => {
                      const itemIndex = itemIndexMap.get(`goal_${goal.id}`) ?? 0;
                      const isSelected = selectedIndex === itemIndex;
                      const isDone = goal.status === 'Completed';

                      return (
                        <div
                          key={goal.id}
                          id={`search-result-${itemIndex}`}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={-1}
                          aria-label={`Goal: ${goal.title || 'Untitled'}${goal.status ? `, status: ${goal.status}` : ''}${goal.priority ? `, priority: ${goal.priority}` : ''}`}
                          data-index={itemIndex}
                          onClick={() => handleSelectItem({ type: 'goal', data: goal })}
                          onMouseMove={() => {
                            isUsingKeyboardRef.current = false;
                          }}
                          onMouseEnter={() => {
                            if (!isUsingKeyboardRef.current) {
                              setSelectedIndex(itemIndex);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#F5F5FA] border-[#191927] ring-1 ring-[#191927] shadow-xs'
                              : 'bg-white border-[#E8E8EE] hover:border-[#191927]/40'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-xs font-semibold truncate ${
                                  isDone
                                    ? 'line-through text-[#8E8EA0]'
                                    : 'text-[#191927]'
                                }`}
                              >
                                <HighlightMatch text={goal.title || 'Untitled goal'} query={query} />
                              </h4>
                            </div>

                            {goal.description && (
                              <p className="text-[11px] text-[#646477] line-clamp-1 mt-0.5">
                                <HighlightMatch
                                  text={getMatchingSnippet(goal.description, query, 120)}
                                  query={query}
                                />
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                              {goal.category && <CategoryTag category={goal.category} />}
                              <StatusIndicator status={goal.status} />
                              <PriorityIndicator priority={goal.priority} />
                              {goal.targetDate && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#646477]">
                                  <CalendarIcon className="w-3 h-3 text-[#8E8EA0]" aria-hidden="true" />
                                  <span>{formatDate(goal.targetDate)}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-[#8E8EA0] pt-1">
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-[#191927]" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group B: Notes */}
              {(filterType === 'all' || filterType === 'notes') && matchedNotes.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#646477] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#A9C9F5]" aria-hidden="true" />
                      <span>Notes ({matchedNotes.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {matchedNotes.map((note) => {
                      const itemIndex = itemIndexMap.get(`note_${note.id}`) ?? 0;
                      const isSelected = selectedIndex === itemIndex;

                      return (
                        <div
                          key={note.id}
                          id={`search-result-${itemIndex}`}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={-1}
                          aria-label={`Note: ${note.title || 'Untitled'}${note.isFavorite ? ', favorite' : ''}`}
                          data-index={itemIndex}
                          onClick={() => handleSelectItem({ type: 'note', data: note })}
                          onMouseMove={() => {
                            isUsingKeyboardRef.current = false;
                          }}
                          onMouseEnter={() => {
                            if (!isUsingKeyboardRef.current) {
                              setSelectedIndex(itemIndex);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#F5F5FA] border-[#191927] ring-1 ring-[#191927] shadow-xs'
                              : 'bg-white border-[#E8E8EE] hover:border-[#191927]/40'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {note.isFavorite && (
                                <Star
                                  className="w-3 h-3 text-[#F9E94E] fill-[#F9E94E] shrink-0"
                                  aria-label="Favorite note"
                                />
                              )}
                              <h4 className="text-xs font-semibold text-[#191927] truncate">
                                <HighlightMatch text={note.title || 'Untitled note'} query={query} />
                              </h4>
                            </div>

                            {note.content && (
                              <p className="text-[11px] text-[#646477] line-clamp-2 mt-1 leading-relaxed">
                                <HighlightMatch
                                  text={getMatchingSnippet(note.content, query, 140)}
                                  query={query}
                                />
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                              {note.category && <CategoryTag category={note.category} />}
                              {note.tags && note.tags.length > 0 && (
                                <span className="text-[10px] text-[#8E8EA0]">
                                  #{note.tags.join(', #')}
                                </span>
                              )}
                              <span className="text-[11px] text-[#8E8EA0] tabular-nums">
                                {formatRelativeOrShortDate(note.updatedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-[#8E8EA0] pt-1">
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-[#191927]" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Group C: Categories */}
              {(filterType === 'all' || filterType === 'categories') && matchedCategories.length > 0 && (
                <div className="space-y-2 pt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#646477] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#F6C6DA]" aria-hidden="true" />
                      <span>Categories ({matchedCategories.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {matchedCategories.map((category) => {
                      const itemIndex = itemIndexMap.get(`category_${category.id}`) ?? 0;
                      const isSelected = selectedIndex === itemIndex;
                      const counts = categoryCountsMap.get(category.id) || { goalCount: 0, noteCount: 0 };
                      const { goalCount, noteCount } = counts;

                      return (
                        <div
                          key={category.id}
                          id={`search-result-${itemIndex}`}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={-1}
                          aria-label={`Category: ${category.name}, ${goalCount} goals, ${noteCount} notes`}
                          data-index={itemIndex}
                          onClick={() => handleSelectItem({ type: 'category', data: category })}
                          onMouseMove={() => {
                            isUsingKeyboardRef.current = false;
                          }}
                          onMouseEnter={() => {
                            if (!isUsingKeyboardRef.current) {
                              setSelectedIndex(itemIndex);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-[#F5F5FA] border-[#191927] ring-1 ring-[#191927] shadow-xs'
                              : 'bg-white border-[#E8E8EE] hover:border-[#191927]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-[#191927]/10"
                              style={{ backgroundColor: category.color }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-[#191927] truncate">
                                <HighlightMatch text={category.name} query={query} />
                              </h4>
                              <p className="text-[11px] text-[#8E8EA0] mt-0.5">
                                {goalCount} {goalCount === 1 ? 'goal' : 'goals'} &middot; {noteCount}{' '}
                                {noteCount === 1 ? 'note' : 'notes'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                            {onNavigateGoalsWithCategory && goalCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateGoalsWithCategory(category.name);
                                  onClose();
                                }}
                                className="text-[11px] font-medium text-[#646477] hover:text-[#191927] hover:underline px-2 py-1 rounded border border-[#E8E8EE] bg-white hover:bg-[#FAFAFC] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
                                aria-label={`View goals in category ${category.name}`}
                              >
                                View Goals &rarr;
                              </button>
                            )}
                            {onNavigateNotesWithCategory && noteCount > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateNotesWithCategory(category.name);
                                  onClose();
                                }}
                                className="text-[11px] font-medium text-[#646477] hover:text-[#191927] hover:underline px-2 py-1 rounded border border-[#E8E8EE] bg-white hover:bg-[#FAFAFC] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927]"
                                aria-label={`View notes in category ${category.name}`}
                              >
                                View Notes &rarr;
                              </button>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-[#191927] ml-1" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with keyboard hints */}
        <div className="px-4 py-2.5 bg-[#FAFAFC] border-t border-[#E8E8EE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#8E8EA0]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E8E8EE] rounded text-[10px] font-mono text-[#646477]">
                &uarr; &darr;
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E8E8EE] rounded text-[10px] font-mono text-[#646477]">
                &crarr;
              </kbd>
              <span>to open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E8E8EE] rounded text-[10px] font-mono text-[#646477]">
                esc
              </kbd>
              <span>to close</span>
            </span>
          </div>

          {totalCount > 0 && (
            <span className="tabular-nums font-medium text-[#646477]">
              {totalCount} {totalCount === 1 ? 'result' : 'results'} found
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
