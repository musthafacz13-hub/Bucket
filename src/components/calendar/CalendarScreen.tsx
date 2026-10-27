import React, { useState, useMemo } from 'react';
import { Goal, Category } from '../../types';
import {
  formatDate,
  formatDateToYmd,
  parseYmdDate,
  getMonthCalendarGrid,
  getWeekDays,
  formatPeriodHeading,
  isSameDateDay,
} from '../../utils/date';
import { CategoryTag } from '../common/CategoryTag';
import { StatusIndicator, PriorityIndicator } from '../common/StatusIndicator';
import { EmptyState } from '../common/EmptyState';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  Square,
  Search,
  X,
  Clock,
  Maximize2,
  Edit2,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';

export type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarScreenProps {
  goals: Goal[];
  categories: Category[];
  onOpenGoalDetails: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onToggleCompleteGoal: (goalId: string) => void;
  onNewGoalForDate: (dateYmd: string) => void;
  initialViewMode?: CalendarViewMode;
}

const WEEKDAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_NAMES_MINI = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  goals,
  categories,
  onOpenGoalDetails,
  onEditGoal,
  onToggleCompleteGoal,
  onNewGoalForDate,
  initialViewMode = 'month',
}) => {
  // Navigation & View States
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(initialViewMode);

  // Sync if preference changes
  React.useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  // Filters within Calendar
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');

  const todayYmd = useMemo(() => formatDateToYmd(new Date()), []);
  const selectedYmd = useMemo(() => formatDateToYmd(selectedDate), [selectedDate]);

  // Map of category lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) {
      map.set(c.id, c);
      map.set(c.name.toLowerCase().trim(), c);
    }
    return map;
  }, [categories]);

  // Filtered goals according to calendar search and filters
  const filteredGoals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return goals.filter((g) => {
      // 1. Must have a valid targetDate for calendar display
      if (!g.targetDate || !g.targetDate.trim()) return false;
      const parsed = parseYmdDate(g.targetDate);
      if (!parsed) return false;

      // 2. Status filter
      if (statusFilter === 'Active' && g.status === 'Completed') return false;
      if (statusFilter === 'Completed' && g.status !== 'Completed') return false;

      // 3. Category filter
      if (categoryFilter !== 'All') {
        if (categoryFilter === 'Unassigned') {
          const hasNoCategory =
            !g.categoryId && (!g.category || !g.category.trim() || g.category.toLowerCase() === 'unassigned');
          if (!hasNoCategory) return false;
        } else {
          const selectedCat = categoryMap.get(categoryFilter) || categoryMap.get(categoryFilter.toLowerCase().trim());
          const targetCatId = selectedCat ? selectedCat.id : categoryFilter;
          const targetCatName = (selectedCat ? selectedCat.name : categoryFilter).toLowerCase().trim();

          const matchesName = Boolean(g.category && g.category.toLowerCase().trim() === targetCatName);
          const matchesId = Boolean(g.categoryId && (g.categoryId === targetCatId || g.categoryId === categoryFilter));
          const resolvedCat = g.categoryId ? categoryMap.get(g.categoryId) : null;
          const matchesResolved = Boolean(resolvedCat && resolvedCat.name.toLowerCase().trim() === targetCatName);

          if (!matchesName && !matchesId && !matchesResolved) return false;
        }
      }

      // 4. Search query
      if (q) {
        const matchTitle = (g.title || '').toLowerCase().includes(q);
        const matchDesc = (g.description || '').toLowerCase().includes(q);
        const matchCat = (g.category || '').toLowerCase().includes(q);
        const resolvedName = g.categoryId ? categoryMap.get(g.categoryId)?.name.toLowerCase() : '';
        const matchResolved = Boolean(resolvedName && resolvedName.includes(q));
        if (!matchTitle && !matchDesc && !matchCat && !matchResolved) return false;
      }

      return true;
    });
  }, [goals, searchQuery, categoryFilter, statusFilter, categoryMap]);

  // Indexed goals by YYYY-MM-DD
  const goalsByDate = useMemo(() => {
    const map = new Map<string, Goal[]>();
    for (const g of filteredGoals) {
      if (!g.targetDate) continue;
      const parsed = parseYmdDate(g.targetDate);
      if (!parsed) continue;
      const ymd = formatDateToYmd(parsed);
      const existing = map.get(ymd) || [];
      existing.push(g);
      map.set(ymd, existing);
    }
    return map;
  }, [filteredGoals]);

  // Scheduled vs Unscheduled total counts across all goals
  const totalScheduledGoals = useMemo(() => {
    return goals.filter((g) => Boolean(g.targetDate && g.targetDate.trim() && parseYmdDate(g.targetDate))).length;
  }, [goals]);

  // Goals for selected date
  const selectedDateGoals = useMemo(() => {
    return goalsByDate.get(selectedYmd) || [];
  }, [goalsByDate, selectedYmd]);

  // Period Navigation Actions
  const handleNavigatePeriod = (direction: -1 | 1) => {
    setCurrentDate((prev) => {
      if (viewMode === 'month') {
        const targetYear = prev.getFullYear();
        const targetMonth = prev.getMonth() + direction;
        const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0, 12, 0, 0).getDate();
        const clampedDay = Math.min(prev.getDate(), daysInTargetMonth);
        const next = new Date(targetYear, targetMonth, clampedDay, 12, 0, 0);
        return next;
      } else if (viewMode === 'week') {
        const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + direction * 7, 12, 0, 0);
        return next;
      } else {
        const next = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + direction, 12, 0, 0);
        setSelectedDate(new Date(next));
        return next;
      }
    });
  };

  const handleNavigateToday = () => {
    const now = new Date();
    const todayAtNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    setCurrentDate(todayAtNoon);
    setSelectedDate(todayAtNoon);
  };

  const handleSelectDate = (date: Date) => {
    const safeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    setSelectedDate(safeDate);
    setCurrentDate(safeDate);
  };

  // Keyboard navigation on calendar grid
  const handleGridKeyDown = (e: React.KeyboardEvent, date: Date) => {
    let diffDays = 0;
    if (e.key === 'ArrowRight') diffDays = 1;
    else if (e.key === 'ArrowLeft') diffDays = -1;
    else if (e.key === 'ArrowDown') diffDays = 7;
    else if (e.key === 'ArrowUp') diffDays = -7;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectDate(date);
      return;
    } else {
      return;
    }

    e.preventDefault();
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffDays, 12, 0, 0);
    handleSelectDate(target);
    setCurrentDate(target);

    // Focus the target date button
    const targetYmd = formatDateToYmd(target);
    setTimeout(() => {
      const el = document.querySelector<HTMLButtonElement>(`button[data-date="${targetYmd}"]`);
      el?.focus();
    }, 10);
  };

  // Month grid calculation
  const monthGridDays = useMemo(() => {
    return getMonthCalendarGrid(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  // Week days calculation
  const weekDays = useMemo(() => {
    return getWeekDays(currentDate);
  }, [currentDate]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || categoryFilter !== 'All' || statusFilter !== 'All';

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191927]">
            Calendar &amp; Scheduling
          </h1>
          <p className="text-xs sm:text-sm text-[#646477] mt-0.5">
            Plan your timeline, track milestone deadlines, and schedule your bucket list.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNewGoalForDate(selectedYmd)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] active:bg-[#141420] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927] min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Goal</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#E8E8EE] space-y-3">
        {/* Top controls: Period navigation & View mode switch */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNavigateToday}
              className="px-3 py-1.5 text-xs font-medium text-[#191927] bg-[#FAFAFC] hover:bg-[#F3F3F7] active:bg-[#E8E8EE] border border-[#E8E8EE] rounded-lg transition-colors min-h-[32px]"
            >
              Today
            </button>

            <div className="inline-flex items-center rounded-lg border border-[#E8E8EE] bg-[#FAFAFC] p-0.5">
              <button
                type="button"
                onClick={() => handleNavigatePeriod(-1)}
                className="p-1 rounded text-[#646477] hover:text-[#191927] hover:bg-white transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                aria-label={`Previous ${viewMode}`}
                title={`Previous ${viewMode}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigatePeriod(1)}
                className="p-1 rounded text-[#646477] hover:text-[#191927] hover:bg-white transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
                aria-label={`Next ${viewMode}`}
                title={`Next ${viewMode}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-sm sm:text-base font-bold text-[#191927] ml-2 tracking-tight">
              {formatPeriodHeading(viewMode, currentDate)}
            </h2>
          </div>

          {/* View Mode Switcher */}
          <div
            className="inline-flex items-center self-start sm:self-auto p-0.5 bg-[#F3F3F7] rounded-lg border border-[#E8E8EE]"
            role="group"
            aria-label="Calendar view switcher"
          >
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs font-medium capitalize rounded-md transition-all ${
                  viewMode === mode
                    ? 'bg-white text-[#191927] shadow-xs'
                    : 'text-[#646477] hover:text-[#191927]'
                }`}
                aria-pressed={viewMode === mode}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar: Search, Category, Status */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-[#F0F0F4]">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8EA0] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scheduled goals..."
                className="w-full pl-8 pr-7 py-1 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:bg-white transition-all placeholder:text-[#8E8EA0]"
                aria-label="Search scheduled goals"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E8EA0] hover:text-[#191927] p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="calendar-category-select" className="sr-only">
                Filter by Category
              </label>
              <select
                id="calendar-category-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="calendar-status-select" className="sr-only">
                Filter by Status
              </label>
              <select
                id="calendar-status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Completed')}
                className="text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#191927] transition-all cursor-pointer min-h-[30px]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Completed">Completed Only</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-[#646477] hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#8E8EA0] tabular-nums self-end sm:self-auto">
            {totalScheduledGoals} {totalScheduledGoals === 1 ? 'goal scheduled' : 'goals scheduled'}
          </div>
        </div>
      </div>

      {/* Main Calendar Layout */}
      {totalScheduledGoals === 0 && !hasActiveFilters && (
        <div className="bg-[#FFFDF5] border border-[#F9E94E]/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#F9E94E] shrink-0" aria-hidden="true" />
            <p className="text-xs text-[#191927]">
              No goals have target dates scheduled yet. Select any date on the calendar below or click &ldquo;Schedule Goal&rdquo; to plan your target milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNewGoalForDate(selectedYmd)}
            className="text-xs font-semibold text-[#191927] underline hover:no-underline shrink-0"
          >
            Schedule for Today →
          </button>
        </div>
      )}

      {/* View Renderings */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Month Calendar Grid (Takes 2 cols on lg) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E8E8EE] overflow-hidden shadow-xs">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-[#E8E8EE] bg-[#FAFAFC] text-center text-[11px] font-semibold text-[#646477] uppercase tracking-wider py-2">
              {WEEKDAY_NAMES_SHORT.map((day, idx) => (
                <div key={day} title={WEEKDAY_NAMES_FULL[idx]}>
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{WEEKDAY_NAMES_MINI[idx]}</span>
                </div>
              ))}
            </div>

            {/* 42-day Month Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E8EE] border-b border-[#E8E8EE]">
              {monthGridDays.map((dayDate) => {
                const dayYmd = formatDateToYmd(dayDate);
                const dayNumber = dayDate.getDate();
                const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth();
                const isToday = dayYmd === todayYmd;
                const isSelected = dayYmd === selectedYmd;
                const dayGoals = goalsByDate.get(dayYmd) || [];

                return (
                  <button
                    key={dayYmd}
                    type="button"
                    data-date={dayYmd}
                    onClick={() => handleSelectDate(dayDate)}
                    onKeyDown={(e) => handleGridKeyDown(e, dayDate)}
                    className={`min-h-[68px] sm:min-h-[96px] p-1 sm:p-2 text-left flex flex-col justify-between transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#191927] ${
                      !isCurrentMonth ? 'bg-[#FAFAFC]/60 text-[#A0A0B2]' : 'bg-white text-[#191927]'
                    } ${isSelected ? 'ring-2 ring-inset ring-[#191927] bg-[#F5F5FA]' : 'hover:bg-[#FAFAFC]'}`}
                    aria-label={`${dayDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}, ${dayGoals.length} goals scheduled`}
                  >
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-semibold tabular-nums inline-flex items-center justify-center rounded-full ${
                          isToday
                            ? 'w-5 h-5 bg-[#191927] text-white'
                            : isSelected
                            ? 'w-5 h-5 font-bold text-[#191927]'
                            : ''
                        }`}
                      >
                        {dayNumber}
                      </span>

                      {dayGoals.length > 0 && (
                        <span className="text-[10px] text-[#646477] font-medium sm:hidden">
                          {dayGoals.length}
                        </span>
                      )}
                    </div>

                    {/* Goal badges/pills in cell (Desktop) */}
                    <div className="hidden sm:flex flex-col gap-1 mt-1 w-full overflow-hidden">
                      {dayGoals.slice(0, 2).map((goal) => {
                        const cat = goal.categoryId || goal.category ? categoryMap.get(goal.categoryId || goal.category.toLowerCase().trim()) : null;
                        const isDone = goal.status === 'Completed';

                        return (
                          <div
                            key={goal.id}
                            className={`px-1.5 py-0.5 rounded text-[11px] truncate flex items-center gap-1 border ${
                              isDone
                                ? 'bg-[#F3F3F7] text-[#8E8EA0] line-through border-transparent'
                                : 'bg-[#FAFAFC] text-[#191927] border-[#E8E8EE]'
                            }`}
                            title={goal.title}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.color || '#191927' }}
                              aria-hidden="true"
                            />
                            <span className="truncate">{goal.title}</span>
                          </div>
                        );
                      })}

                      {dayGoals.length > 2 && (
                        <span className="text-[10px] text-[#8E8EA0] font-medium pl-1">
                          +{dayGoals.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Mobile Dots Indicator */}
                    <div className="flex sm:hidden items-center gap-0.5 mt-auto pt-1 flex-wrap">
                      {dayGoals.slice(0, 3).map((goal) => (
                        <span
                          key={goal.id}
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            goal.status === 'Completed' ? 'bg-[#08C83D]' : 'bg-[#191927]'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected-Date Panel (Takes 1 col on lg) */}
          <div
            id="selected-date-panel"
            aria-live="polite"
            className="bg-white rounded-xl border border-[#E8E8EE] p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8EE]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#646477]">
                  Selected Date
                </span>
                <h3 className="text-base font-bold text-[#191927]">
                  {new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(selectedDate)}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onNewGoalForDate(selectedYmd)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] rounded-lg transition-colors min-h-[30px]"
                aria-label={`Add goal for ${selectedYmd}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal</span>
              </button>
            </div>

            {selectedDateGoals.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8E8EA0] space-y-2">
                <Clock className="w-6 h-6 mx-auto text-[#D0D0DC]" />
                <p>No goals scheduled for this date.</p>
                <button
                  type="button"
                  onClick={() => onNewGoalForDate(selectedYmd)}
                  className="text-xs font-semibold text-[#191927] underline hover:no-underline"
                >
                  Schedule a goal now
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDateGoals.map((goal) => {
                  const isDone = goal.status === 'Completed';

                  return (
                    <div
                      key={goal.id}
                      className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                        isDone
                          ? 'bg-[#FAFAFC] border-[#E8E8EE] opacity-80'
                          : 'bg-white border-[#E8E8EE] hover:border-[#191927]/30 shadow-xs'
                      }`}
                    >
                      {/* Checkbox Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompleteGoal(goal.id);
                        }}
                        className="mt-0.5 text-[#646477] hover:text-[#191927] p-0.5 rounded transition-colors"
                        aria-label={isDone ? `Mark "${goal.title}" in progress` : `Complete "${goal.title}"`}
                      >
                        {isDone ? (
                          <CheckSquare className="w-4 h-4 text-[#08C83D]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#8E8EA0]" />
                        )}
                      </button>

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onOpenGoalDetails(goal)}
                      >
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isDone ? 'line-through text-[#8E8EA0]' : 'text-[#191927] hover:underline'
                          }`}
                        >
                          {goal.title}
                        </h4>

                        {goal.description && (
                          <p className="text-[11px] text-[#646477] line-clamp-1 mt-0.5">
                            {goal.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#646477] tabular-nums">
                            <CalendarIcon className="w-3 h-3 text-[#8E8EA0]" aria-hidden="true" />
                            <span>{formatDate(goal.targetDate)}</span>
                          </span>
                          {goal.category && <CategoryTag category={goal.category} />}
                          <StatusIndicator status={goal.status} />
                          <PriorityIndicator priority={goal.priority} />
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenGoalDetails(goal);
                          }}
                          className="p-1 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded min-h-[26px] min-w-[26px] flex items-center justify-center"
                          title="Inspect goal details"
                          aria-label={`Inspect goal "${goal.title}"`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditGoal(goal);
                          }}
                          className="p-1 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded min-h-[26px] min-w-[26px] flex items-center justify-center"
                          title="Edit goal"
                          aria-label={`Edit goal "${goal.title}"`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-xl border border-[#E8E8EE] overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#E8E8EE]">
            {weekDays.map((dayDate) => {
              const dayYmd = formatDateToYmd(dayDate);
              const isToday = dayYmd === todayYmd;
              const isSelected = dayYmd === selectedYmd;
              const dayGoals = goalsByDate.get(dayYmd) || [];

              return (
                <div
                  key={dayYmd}
                  className={`min-h-[240px] flex flex-col ${
                    isSelected ? 'bg-[#FAFAFC]' : 'bg-white'
                  }`}
                >
                  {/* Column Date Header */}
                  <div
                    onClick={() => handleSelectDate(dayDate)}
                    className={`p-3 border-b border-[#E8E8EE] cursor-pointer flex items-center justify-between md:flex-col md:items-start gap-1 ${
                      isSelected ? 'bg-[#F0F0F6]' : 'hover:bg-[#FAFAFC]'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-[#646477] uppercase">
                      {WEEKDAY_NAMES_SHORT[dayDate.getDay()]}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-bold tabular-nums inline-flex items-center justify-center rounded-full ${
                          isToday
                            ? 'w-6 h-6 bg-[#191927] text-white'
                            : 'text-[#191927]'
                        }`}
                      >
                        {dayDate.getDate()}
                      </span>
                      <span className="text-[10px] text-[#8E8EA0] md:hidden">
                        ({dayGoals.length} {dayGoals.length === 1 ? 'goal' : 'goals'})
                      </span>
                    </div>
                  </div>

                  {/* Goals List inside Day Column */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {dayGoals.map((goal) => {
                      const isDone = goal.status === 'Completed';

                      return (
                        <div
                          key={goal.id}
                          onClick={() => onOpenGoalDetails(goal)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            isDone
                              ? 'bg-[#FAFAFC] border-[#E8E8EE] opacity-75'
                              : 'bg-white border-[#E8E8EE] hover:border-[#191927]/40 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-xs font-semibold truncate ${
                                isDone ? 'line-through text-[#8E8EA0]' : 'text-[#191927]'
                              }`}
                            >
                              {goal.title}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCompleteGoal(goal.id);
                              }}
                              className="text-[#8E8EA0] hover:text-[#191927] p-0.5"
                            >
                              {isDone ? (
                                <CheckSquare className="w-3.5 h-3.5 text-[#08C83D]" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {goal.category && (
                            <div className="mt-1">
                              <CategoryTag category={goal.category} />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => onNewGoalForDate(dayYmd)}
                      className="w-full py-1.5 px-2 border border-dashed border-[#D0D0DC] hover:border-[#191927] text-[#646477] hover:text-[#191927] rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Goal</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-xl border border-[#E8E8EE] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E8E8EE]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#646477]">
                Day Overview
              </span>
              <h2 className="text-xl font-bold text-[#191927]">
                {formatPeriodHeading('day', currentDate)}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onNewGoalForDate(formatDateToYmd(currentDate))}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] rounded-lg transition-colors min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {isSameDateDay(currentDate, new Date())
                  ? 'Schedule Goal for Today'
                  : `Schedule Goal for ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(currentDate)}`}
              </span>
            </button>
          </div>

          {/* Goals for this day */}
          {goalsByDate.get(formatDateToYmd(currentDate))?.length === 0 ||
          !goalsByDate.get(formatDateToYmd(currentDate)) ? (
            <div className="py-12 text-center text-xs text-[#8E8EA0] space-y-3">
              <Clock className="w-8 h-8 mx-auto text-[#D0D0DC]" />
              <p className="text-sm font-medium text-[#191927]">No goals scheduled on this day</p>
              <p className="text-xs text-[#646477]">
                Assign a deadline to an existing goal or schedule a new milestone.
              </p>
              <button
                type="button"
                onClick={() => onNewGoalForDate(formatDateToYmd(currentDate))}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] hover:bg-[#F3F3F7] rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Goal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {goalsByDate.get(formatDateToYmd(currentDate))?.map((goal) => {
                const isDone = goal.status === 'Completed';

                return (
                  <div
                    key={goal.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-[#FAFAFC] border-[#E8E8EE] opacity-80'
                        : 'bg-white border-[#E8E8EE] hover:border-[#191927]/30 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCompleteGoal(goal.id);
                        }}
                        className="mt-0.5 text-[#646477] hover:text-[#191927] p-1 rounded transition-colors"
                        aria-label={isDone ? `Mark "${goal.title}" in progress` : `Complete "${goal.title}"`}
                      >
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-[#08C83D]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#8E8EA0]" />
                        )}
                      </button>

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onOpenGoalDetails(goal)}
                      >
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm font-semibold truncate ${
                              isDone ? 'line-through text-[#8E8EA0]' : 'text-[#191927] hover:underline'
                            }`}
                          >
                            {goal.title}
                          </h3>
                        </div>

                        {goal.description && (
                          <p className="text-xs text-[#646477] line-clamp-2 mt-1">
                            {goal.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#646477] tabular-nums">
                            <CalendarIcon className="w-3.5 h-3.5 text-[#8E8EA0]" aria-hidden="true" />
                            <span>{formatDate(goal.targetDate)}</span>
                          </span>
                          {goal.category && <CategoryTag category={goal.category} />}
                          <StatusIndicator status={goal.status} />
                          <PriorityIndicator priority={goal.priority} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0F0F4] w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenGoalDetails(goal);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] hover:bg-[#F3F3F7] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGoal(goal);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] hover:bg-[#F3F3F7] rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
