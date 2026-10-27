import React from 'react';
import { Goal, GoalStatus } from '../../types';
import { formatDate } from '../../utils/date';
import { StatusIndicator, PriorityIndicator } from '../common/StatusIndicator';
import { CategoryTag } from '../common/CategoryTag';
import { EmptyState } from '../common/EmptyState';
import {
  Target,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Circle,
  Calendar,
  SearchX,
  FilterX,
} from 'lucide-react';

interface BucketListTableProps {
  goals: Goal[];
  totalCollectionCount: number;
  statusFilter: 'All' | GoalStatus;
  isSearching?: boolean;
  hasActiveFilters: boolean;
  onNewGoal: () => void;
  onOpenDetails: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onToggleComplete: (goalId: string) => void;
  onDeleteGoal: (goal: Goal) => void;
  onClearFilters: () => void;
}

export const BucketListTable: React.FC<BucketListTableProps> = ({
  goals,
  totalCollectionCount,
  statusFilter,
  isSearching,
  hasActiveFilters,
  onNewGoal,
  onOpenDetails,
  onEditGoal,
  onToggleComplete,
  onDeleteGoal,
  onClearFilters,
}) => {
  // Empty states handling according to Section 12:
  if (totalCollectionCount === 0) {
    return (
      <div className="bg-white border border-[#E8E8EE] rounded-xl p-6 sm:p-10">
        <EmptyState
          icon={Target}
          heading="Your bucket list starts here."
          description="Add something you want to do, learn, or experience."
          actionLabel="Create Your First Goal"
          onAction={onNewGoal}
        />
      </div>
    );
  }

  if (goals.length === 0) {
    // If a search query is active, show "No goals found."
    if (isSearching) {
      return (
        <div className="bg-white border border-[#E8E8EE] rounded-xl p-6 sm:p-10">
          <EmptyState
            icon={SearchX}
            heading="No goals found."
            description="Try another search or adjust your filters."
            actionLabel="Clear Filters"
            onAction={onClearFilters}
          />
        </div>
      );
    }

    // If filtering by a specific status with no search, show "Nothing in this category yet."
    if (statusFilter !== 'All') {
      return (
        <div className="bg-white border border-[#E8E8EE] rounded-xl p-6 sm:p-10">
          <EmptyState
            icon={FilterX}
            heading="Nothing in this category yet."
            description="Your goals will appear here when they match this status."
            actionLabel="Clear Filters"
            onAction={onClearFilters}
          />
        </div>
      );
    }

    return (
      <div className="bg-white border border-[#E8E8EE] rounded-xl p-6 sm:p-10">
        <EmptyState
          icon={SearchX}
          heading="No goals found."
          description="Try another search or adjust your filters."
          actionLabel="Clear Filters"
          onAction={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8E8EE] rounded-xl overflow-hidden">
      {/* DESKTOP TABLE LAYOUT (Hidden on mobile < 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="border-b border-[#E8E8EE] bg-[#FAFAFC] text-[11px] font-semibold text-[#646477] uppercase tracking-wider">
              <th scope="col" className="py-3 px-4 w-10">
                <span className="sr-only">Completion</span>
              </th>
              <th scope="col" className="py-3 px-4 min-w-[240px]">
                Goal
              </th>
              <th scope="col" className="py-3 px-4 w-32">
                Category
              </th>
              <th scope="col" className="py-3 px-4 w-28">
                Priority
              </th>
              <th scope="col" className="py-3 px-4 w-36">
                Target Date
              </th>
              <th scope="col" className="py-3 px-4 w-32">
                Status
              </th>
              <th scope="col" className="py-3 px-4 w-28 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F4] text-xs">
            {goals.map((goal) => {
              const isCompleted = goal.status === 'Completed';

              return (
                <tr
                  key={goal.id}
                  className="hover:bg-[#FAFAFC] transition-colors group cursor-pointer"
                  onClick={() => onOpenDetails(goal)}
                >
                  {/* Completion Toggle */}
                  <td
                    className="py-3 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleComplete(goal.id)}
                      className="p-1 text-[#8E8EA0] hover:text-[#08C83D] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927]"
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
                  </td>

                  {/* Goal Title & Description */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span
                        className={`font-medium block transition-colors ${
                          isCompleted ? 'line-through text-[#8E8EA0]' : 'text-[#191927]'
                        }`}
                      >
                        {goal.title}
                      </span>
                      {goal.description && (
                        <p className="text-[11px] text-[#646477] line-clamp-1 max-w-md">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <CategoryTag category={goal.category} />
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4">
                    <PriorityIndicator priority={goal.priority} />
                  </td>

                  {/* Target Date */}
                  <td className="py-3 px-4 text-[#646477]">
                    {goal.targetDate ? (
                      <span className="tabular-nums text-[#191927]">
                        {formatDate(goal.targetDate)}
                      </span>
                    ) : (
                      <span className="text-[#8E8EA0]">No target date</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <StatusIndicator status={goal.status} />
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(goal)}
                        className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-white rounded border border-transparent hover:border-[#E8E8EE] transition-all"
                        aria-label={`Open details for "${goal.title}"`}
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditGoal(goal)}
                        className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-white rounded border border-transparent hover:border-[#E8E8EE] transition-all"
                        aria-label={`Edit goal "${goal.title}"`}
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(goal)}
                        className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-all"
                        aria-label={`Delete goal "${goal.title}"`}
                        title="Delete goal"
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

      {/* MOBILE LIST LAYOUT (Visible only on < 768px) */}
      <div className="md:hidden divide-y divide-[#F0F0F4] p-3">
        {goals.map((goal) => {
          const isCompleted = goal.status === 'Completed';

          return (
            <div
              key={goal.id}
              className="py-3.5 px-2 flex flex-col gap-2.5 active:bg-[#FAFAFC] rounded-lg transition-colors"
              onClick={() => onOpenDetails(goal)}
            >
              {/* Row 1: Checkbox + Prominent Title */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(goal.id);
                  }}
                  className="mt-0.5 p-1 -m-1 text-[#8E8EA0] hover:text-[#08C83D] transition-colors rounded min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
                  aria-label={
                    isCompleted
                      ? `Mark "${goal.title}" as incomplete`
                      : `Mark "${goal.title}" as completed`
                  }
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#08C83D]" />
                  ) : (
                    <Circle className="w-4 h-4 hover:stroke-[#08C83D]" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-sm font-medium ${
                      isCompleted ? 'line-through text-[#8E8EA0]' : 'text-[#191927]'
                    }`}
                  >
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-[#646477] line-clamp-1 mt-0.5">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Secondary Metadata (Category, Priority, Target Date) */}
              <div className="flex items-center gap-2 text-xs text-[#646477] flex-wrap pl-8">
                <CategoryTag category={goal.category} />
                <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
                <PriorityIndicator priority={goal.priority} />
                <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
                {goal.targetDate ? (
                  <span className="flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3 h-3 text-[#8E8EA0]" />
                    <span>{formatDate(goal.targetDate)}</span>
                  </span>
                ) : (
                  <span className="text-[#8E8EA0]">No target date</span>
                )}
              </div>

              {/* Row 3: Status Indicator + Action Buttons */}
              <div
                className="flex items-center justify-between pt-2 border-t border-[#F0F0F4] pl-8"
                onClick={(e) => e.stopPropagation()}
              >
                <StatusIndicator status={goal.status} />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(goal)}
                    className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={`View details for "${goal.title}"`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditGoal(goal)}
                    className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={`Edit "${goal.title}"`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteGoal(goal)}
                    className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label={`Delete "${goal.title}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
