import React, { useState, useEffect, useRef } from 'react';
import { Goal, GoalPriority, GoalStatus, Category } from '../../types';
import { getCategoryAccentColor } from '../common/CategoryTag';
import { X, Tag } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: {
    title: string;
    description: string;
    category: string;
    categoryId?: string | null;
    priority: GoalPriority;
    status: GoalStatus;
    targetDate: string | null;
  }) => void;
  initialGoal?: Goal | null;
  initialTargetDate?: string | null;
  categories?: Category[];
  onOpenManageCategories?: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
  initialTargetDate,
  categories = [],
  onOpenManageCategories,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('Medium');
  const [status, setStatus] = useState<GoalStatus>('Not Started');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      if (initialGoal) {
        setTitle(initialGoal.title);
        setDescription(initialGoal.description || '');
        const existingCatId = initialGoal.categoryId || null;
        const existingCatName = initialGoal.category || '';
        setCategoryId(existingCatId);
        setCategory(existingCatName);
        setPriority(initialGoal.priority || 'Medium');
        setStatus(initialGoal.status || 'Not Started');
        setTargetDate(initialGoal.targetDate || '');
      } else {
        setTitle('');
        setDescription('');
        setCategoryId(null);
        setCategory('');
        setPriority('Medium');
        setStatus('Not Started');
        setTargetDate(initialTargetDate || '');
      }
      setError(null);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
    }
  }, [isOpen, initialGoal, initialTargetDate]);

  // Keyboard accessibility: Escape to close and Tab focus trap
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a goal title.');
      titleInputRef.current?.focus();
      return;
    }

    let validatedDate: string | null = null;
    if (targetDate && targetDate.trim()) {
      const trimmedDate = targetDate.trim();
      const testTime = new Date(trimmedDate).getTime();
      if (!isNaN(testTime)) {
        validatedDate = trimmedDate;
      } else {
        setError('Please enter a valid target date or leave it blank.');
        return;
      }
    }

    onSave({
      title: trimmedTitle,
      description: description.trim(),
      category: category.trim(),
      categoryId: categoryId || null,
      priority,
      status,
      targetDate: validatedDate,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191927]/40 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-xl border border-[#E8E8EE] shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EE]">
          <h2 id="goal-modal-title" className="text-sm font-semibold text-[#191927]">
            {initialGoal ? 'Edit Goal' : 'New Goal'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div
              className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="goal-title" className="block text-xs font-medium text-[#191927] mb-1.5">
              Goal Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="goal-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Hike the Tour du Mont Blanc"
              className="w-full px-3 py-2 text-sm text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all placeholder:text-[#8E8EA0]"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="goal-desc" className="block text-xs font-medium text-[#191927] mb-1.5">
              Description / Notes
            </label>
            <textarea
              id="goal-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key milestones, logistics, or purpose for this goal..."
              className="w-full px-3 py-2 text-sm text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all placeholder:text-[#8E8EA0] resize-y"
            />
          </div>

          {/* Grid row: Category and Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="goal-category-select"
                  className="block text-xs font-medium text-[#191927]"
                >
                  Category
                </label>
                {onOpenManageCategories && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenManageCategories();
                    }}
                    className="text-[11px] text-[#646477] hover:text-[#191927] hover:underline"
                  >
                    Manage →
                  </button>
                )}
              </div>

              {categories.length > 0 ? (
                <div className="space-y-2">
                  <select
                    id="goal-category-select"
                    value={categoryId || (category ? `name:${category}` : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setCategoryId(null);
                        setCategory('');
                      } else if (val.startsWith('name:')) {
                        setCategoryId(null);
                        setCategory(val.replace('name:', ''));
                      } else {
                        const selectedCat = categories.find((c) => c.id === val);
                        setCategoryId(val);
                        setCategory(selectedCat ? selectedCat.name : '');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all cursor-pointer"
                  >
                    <option value="">None (Unassigned)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Quick Select Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {categories.slice(0, 5).map((c) => {
                      const isSelected =
                        categoryId === c.id ||
                        category.toLowerCase().trim() === c.name.toLowerCase().trim();
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setCategoryId(null);
                              setCategory('');
                            } else {
                              setCategoryId(c.id);
                              setCategory(c.name);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md transition-colors ${
                            isSelected
                              ? 'bg-[#191927] text-white font-medium shadow-xs'
                              : 'bg-[#F3F3F7] text-[#646477] hover:bg-[#EBEBEF] hover:text-[#191927]'
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0 border border-[#191927]/20"
                            style={{ backgroundColor: c.color }}
                            aria-hidden="true"
                          />
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#FAFAFC] rounded-lg border border-[#E8E8EE] space-y-1">
                  <p className="text-xs text-[#646477]">No categories created yet.</p>
                  <p className="text-[11px] text-[#8E8EA0]">
                    Goals can be created unassigned or categorized later.
                  </p>
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="goal-priority" className="block text-xs font-medium text-[#191927] mb-1.5">
                Priority
              </label>
              <select
                id="goal-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full px-3 py-2 text-xs text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          {/* Grid row: Status and Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="goal-status" className="block text-xs font-medium text-[#191927] mb-1.5">
                Current Status
              </label>
              <select
                id="goal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-2 text-xs text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Target Date */}
            <div>
              <label htmlFor="goal-target-date" className="block text-xs font-medium text-[#191927] mb-1.5">
                Target Date (Optional)
              </label>
              <input
                id="goal-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-xs text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E8E8EE]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded-lg transition-colors min-h-[38px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191927] min-h-[38px]"
            >
              {initialGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
