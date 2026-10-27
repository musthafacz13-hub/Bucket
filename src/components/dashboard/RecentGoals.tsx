import React, { useState } from 'react';
import { Goal, GoalStatus } from '../../types';
import { formatDate } from '../../utils/date';
import { StatusIndicator, PriorityIndicator } from '../common/StatusIndicator';
import { CategoryTag } from '../common/CategoryTag';
import { EmptyState } from '../common/EmptyState';
import { Target, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface RecentGoalsProps {
  goals: Goal[];
  onNewGoal: () => void;
  onOpenDetails?: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onToggleComplete: (goalId: string) => void;
  onDeleteGoal: (goal: Goal) => void;
  searchQuery?: string;
}

export const RecentGoals: React.FC<RecentGoalsProps> = ({
  goals,
  onNewGoal,
  onOpenDetails,
  onEditGoal,
  onToggleComplete,
  onDeleteGoal,
  searchQuery = '',
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | GoalStatus>('All');

  // Filter by status and search query
  const filteredGoals = goals.filter((g) => {
    const matchesStatus = statusFilter === 'All' || g.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <section className="bg-white border border-[#E8E8EE] rounded-xl overflow-hidden">
      {/* Section Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-[#E8E8EE] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#191927]">Recently Updated</h2>
          <p className="text-xs text-[#646477]">Pick up where you left off.</p>
        </div>

        {/* Filter Tabs (Interactive Segmented Control compliant with zero-pill rule) */}
        {goals.length > 0 && (
          <div
            className="flex items-center gap-1 p-0.5 bg-[#F3F3F7] rounded-lg self-start sm:self-auto overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Filter goals by status"
          >
            {(['All', 'In Progress', 'Completed', 'Not Started'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  statusFilter === tab
                    ? 'bg-white text-[#191927] shadow-xs font-semibold'
                    : 'text-[#646477] hover:text-[#191927]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            heading="Your bucket list starts here."
            description="Add something you want to do, learn, or experience."
            actionLabel="Create Your First Goal"
            onAction={onNewGoal}
          />
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#646477]">
            No goals match the selected filter or search term.
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0F4]">
            {filteredGoals.map((goal) => {
              const isCompleted = goal.status === 'Completed';

              return (
                <div
                  key={goal.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group hover:bg-[#FAFAFC] px-2 rounded-lg transition-colors"
                >
                  {/* Left: Checkbox toggle + Title & metadata */}
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleComplete(goal.id)}
                      className="mt-0.5 p-1 -m-1 text-[#8E8EA0] hover:text-[#08C83D] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927] rounded min-h-[32px] min-w-[32px] flex items-center justify-center"
                      aria-label={
                        isCompleted
                          ? `Mark "${goal.title}" as incomplete`
                          : `Mark "${goal.title}" as completed`
                      }
                      title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#08C83D]" />
                      ) : (
                        <Circle className="w-4 h-4 hover:stroke-[#08C83D]" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span
                          onClick={() => onOpenDetails?.(goal)}
                          className={`text-sm font-medium transition-colors ${
                            onOpenDetails ? 'cursor-pointer hover:underline' : ''
                          } ${
                            isCompleted
                              ? 'line-through text-[#8E8EA0]'
                              : 'text-[#191927]'
                          }`}
                        >
                          {goal.title}
                        </span>
                      </div>

                      {/* Clean unboxed metadata with typographic separators */}
                      <div className="flex items-center gap-2 text-xs text-[#646477] flex-wrap">
                        <CategoryTag category={goal.category} />
                        <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
                        <PriorityIndicator priority={goal.priority} />
                        {goal.targetDate && (
                          <>
                            <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
                            <span className="tabular-nums">Target: {formatDate(goal.targetDate)}</span>
                          </>
                        )}
                      </div>

                      {goal.description && (
                        <p
                          onClick={() => onOpenDetails?.(goal)}
                          className={`text-xs text-[#646477] line-clamp-1 max-w-xl ${
                            onOpenDetails ? 'cursor-pointer' : ''
                          }`}
                        >
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status indicator & Accessible Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0F0F4]">
                    <StatusIndicator status={goal.status} />

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {onOpenDetails && (
                        <button
                          type="button"
                          onClick={() => onOpenDetails(goal)}
                          className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-white rounded-md border border-transparent hover:border-[#E8E8EE] transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                          aria-label={`View details for "${goal.title}"`}
                          title="View details"
                        >
                          <span className="sr-only">Details</span>
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditGoal(goal)}
                        className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-white rounded-md border border-transparent hover:border-[#E8E8EE] transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                        aria-label={`Edit goal "${goal.title}"`}
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal)}
                        className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                        aria-label={`Delete goal "${goal.title}"`}
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
