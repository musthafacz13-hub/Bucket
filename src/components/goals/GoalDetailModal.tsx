import React, { useEffect, useRef } from 'react';
import { Goal, GoalStatus } from '../../types';
import { formatDate, getDaysRemaining } from '../../utils/date';
import { StatusIndicator, PriorityIndicator } from '../common/StatusIndicator';
import { CategoryTag } from '../common/CategoryTag';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  RotateCcw,
  Edit2,
  Trash2,
} from 'lucide-react';

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onStatusChange: (goalId: string, nextStatus: GoalStatus) => void;
  categories?: import('../../types').Category[];
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  isOpen,
  onClose,
  goal,
  onEdit,
  onDelete,
  onStatusChange,
  categories = [],
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    } else if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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
        if (focusableElements.length === 0) return;

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goal) return null;

  const isCompleted = goal.status === 'Completed';
  const countdown = getDaysRemaining(goal.targetDate);

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191927]/40 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-detail-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-xl border border-[#E8E8EE] shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EE]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#646477] font-medium uppercase tracking-wider">
              Goal Details
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Title & Status */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2
                id="goal-detail-title"
                className={`text-lg font-semibold tracking-tight ${
                  isCompleted ? 'text-[#8E8EA0] line-through' : 'text-[#191927]'
                }`}
              >
                {goal.title}
              </h2>
              <StatusIndicator status={goal.status} className="shrink-0 mt-1" />
            </div>

            {/* Quick Status Bar / Toggle */}
            <div className="pt-2 flex items-center gap-2">
              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => onStatusChange(goal.id, 'In Progress')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#191927] bg-[#F3F3F7] hover:bg-[#EBEBEF] rounded-lg transition-colors border border-[#E8E8EE]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#646477]" />
                  <span>Reopen Goal</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStatusChange(goal.id, 'Completed')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#08C83D] hover:bg-[#07B336] rounded-lg transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Mark as Completed</span>
                </button>
              )}

              {/* Status Select for direct granular status adjustment */}
              <div className="flex items-center gap-1.5 ml-auto text-xs text-[#646477]">
                <label htmlFor="goal-detail-status-select" className="sr-only">
                  Change status
                </label>
                <select
                  id="goal-detail-status-select"
                  value={goal.status}
                  onChange={(e) => onStatusChange(goal.id, e.target.value as GoalStatus)}
                  className="px-2.5 py-1.5 text-xs text-[#191927] bg-[#FAFAFC] border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927]"
                >
                  <option value="Not Started">Status: Not Started</option>
                  <option value="In Progress">Status: In Progress</option>
                  <option value="Completed">Status: Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-[#E8E8EE] bg-[#FAFAFC]">
            {/* Category */}
            <div>
              <span className="text-[11px] font-medium text-[#646477] block mb-1">
                Category
              </span>
              <CategoryTag
                category={goal.category || 'Unassigned'}
                color={
                  categories.find(
                    (c) =>
                      c.id === goal.categoryId ||
                      c.name.toLowerCase() === goal.category?.toLowerCase()
                  )?.color
                }
              />
            </div>

            {/* Priority */}
            <div>
              <span className="text-[11px] font-medium text-[#646477] block mb-1">
                Priority
              </span>
              <PriorityIndicator priority={goal.priority} />
            </div>

            {/* Target Date */}
            <div className="col-span-2">
              <span className="text-[11px] font-medium text-[#646477] block mb-1">
                Target Date
              </span>
              {goal.targetDate ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-[#191927] font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#646477]" />
                    <span className="tabular-nums">{formatDate(goal.targetDate)}</span>
                  </div>
                  {countdown && (
                    <span
                      className={`text-[11px] font-medium px-1.5 py-0.5 rounded tabular-nums ${
                        countdown.includes('overdue')
                          ? 'bg-[#F3F3F7] text-[#646477]'
                          : 'bg-[#F9E94E] text-[#191927]'
                      }`}
                    >
                      {countdown}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[#8E8EA0]">No target date set</span>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-xs font-semibold text-[#191927] uppercase tracking-wider mb-2">
              Description &amp; Notes
            </h3>
            {goal.description ? (
              <div className="text-xs sm:text-sm text-[#191927] whitespace-pre-wrap leading-relaxed p-3.5 rounded-lg border border-[#E8E8EE] bg-white">
                {goal.description}
              </div>
            ) : (
              <p className="text-xs text-[#8E8EA0] italic">
                No description provided for this goal.
              </p>
            )}
          </div>

          {/* Timestamps */}
          <div className="pt-2 border-t border-[#F0F0F4] flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#8E8EA0] gap-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8E8EA0]" />
              <span>Created {formatDateTime(goal.createdAt)}</span>
            </span>
            <span>Last updated {formatDateTime(goal.updatedAt)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E8EE] bg-[#FAFAFC]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(goal);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 min-h-[38px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Goal</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded-lg transition-colors min-h-[38px]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(goal);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] rounded-lg transition-colors min-h-[38px]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Goal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
