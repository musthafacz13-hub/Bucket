import React, { useEffect, useRef } from 'react';
import { Category, Goal, Note } from '../../types';
import { formatRelativeOrShortDate } from '../../utils/date';
import { generateNotePreview } from '../../utils/calculations';
import { X, CheckSquare, FileText, ExternalLink, Edit2, Calendar } from 'lucide-react';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  goals: Goal[];
  notes: Note[];
  onEditCategory: (category: Category) => void;
  onNavigateGoalsWithCategory: (categoryName: string) => void;
  onNavigateNotesWithCategory: (categoryName: string) => void;
  onOpenGoalDetails?: (goal: Goal) => void;
  onOpenNoteDetails?: (note: Note) => void;
}

export const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  goals,
  notes,
  onEditCategory,
  onNavigateGoalsWithCategory,
  onNavigateNotesWithCategory,
  onOpenGoalDetails,
  onOpenNoteDetails,
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

  if (!isOpen || !category) return null;

  const catNameLower = category.name.toLowerCase().trim();

  // Associated goals
  const associatedGoals = goals.filter(
    (g) =>
      g.categoryId === category.id ||
      (g.category && g.category.toLowerCase().trim() === catNameLower)
  );

  // Associated notes
  const associatedNotes = notes.filter(
    (n) =>
      n.categoryId === category.id ||
      (n.category && n.category.toLowerCase().trim() === catNameLower)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191927]/40 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-detail-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white rounded-xl border border-[#E8E8EE] shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EE]">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 border border-[#191927]/20"
              style={{ backgroundColor: category.color }}
              aria-hidden="true"
            />
            <h2 id="category-detail-title" className="text-base font-bold tracking-tight text-[#191927]">
              {category.name}
            </h2>
            <span className="text-xs text-[#8E8EA0] tabular-nums">
              ({associatedGoals.length} {associatedGoals.length === 1 ? 'goal' : 'goals'},{' '}
              {associatedNotes.length} {associatedNotes.length === 1 ? 'note' : 'notes'})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditCategory(category);
              }}
              className="p-1.5 rounded-md text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Edit category"
              aria-label={`Edit category "${category.name}"`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Associated Goals Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#191927]">
                <CheckSquare className="w-4 h-4 text-[#08C83D]" />
                <span>Associated Goals ({associatedGoals.length})</span>
              </div>
              {associatedGoals.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateGoalsWithCategory(category.name);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#646477] hover:text-[#191927] transition-colors"
                >
                  <span>Filter in Bucket List</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {associatedGoals.length === 0 ? (
              <div className="p-4 bg-[#FAFAFC] rounded-lg border border-[#E8E8EE] text-center text-xs text-[#8E8EA0]">
                No goals assigned to this category.
              </div>
            ) : (
              <div className="space-y-2">
                {associatedGoals.map((goal) => (
                  <div
                    key={goal.id}
                    role={onOpenGoalDetails ? 'button' : undefined}
                    tabIndex={onOpenGoalDetails ? 0 : undefined}
                    aria-label={onOpenGoalDetails ? `View goal "${goal.title}"` : undefined}
                    onClick={() => {
                      if (onOpenGoalDetails) {
                        onClose();
                        onOpenGoalDetails(goal);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (onOpenGoalDetails && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onClose();
                        onOpenGoalDetails(goal);
                      }
                    }}
                    className={`p-3 rounded-lg border border-[#E8E8EE] bg-white hover:border-[#191927]/30 transition-all flex items-center justify-between gap-3 ${
                      onOpenGoalDetails
                        ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927]'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#191927] truncate">
                          {goal.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            goal.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : goal.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {goal.status}
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-[11px] text-[#646477] line-clamp-1 mt-0.5">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    {goal.targetDate && (
                      <span className="text-[11px] text-[#8E8EA0] shrink-0 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{goal.targetDate}</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated Notes Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#191927]">
                <FileText className="w-4 h-4 text-[#8E8EA0]" />
                <span>Associated Notes ({associatedNotes.length})</span>
              </div>
              {associatedNotes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateNotesWithCategory(category.name);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#646477] hover:text-[#191927] transition-colors"
                >
                  <span>Filter in Notes</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {associatedNotes.length === 0 ? (
              <div className="p-4 bg-[#FAFAFC] rounded-lg border border-[#E8E8EE] text-center text-xs text-[#8E8EA0]">
                No notes assigned to this category.
              </div>
            ) : (
              <div className="space-y-2">
                {associatedNotes.map((note) => (
                  <div
                    key={note.id}
                    role={onOpenNoteDetails ? 'button' : undefined}
                    tabIndex={onOpenNoteDetails ? 0 : undefined}
                    aria-label={onOpenNoteDetails ? `View note "${note.title}"` : undefined}
                    onClick={() => {
                      if (onOpenNoteDetails) {
                        onClose();
                        onOpenNoteDetails(note);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (onOpenNoteDetails && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        onClose();
                        onOpenNoteDetails(note);
                      }
                    }}
                    className={`p-3 rounded-lg border border-[#E8E8EE] bg-white hover:border-[#191927]/30 transition-all flex items-center justify-between gap-3 ${
                      onOpenNoteDetails
                        ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927]'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-[#191927] block truncate">
                        {note.title}
                      </span>
                      <p className="text-[11px] text-[#646477] line-clamp-1 mt-0.5">
                        {generateNotePreview(note.content, 90)}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#8E8EA0] shrink-0 tabular-nums">
                      {formatRelativeOrShortDate(note.updatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E8EE] bg-[#FAFAFC]">
          <span className="text-[11px] text-[#8E8EA0]">
            Created {new Date(category.createdAt).toLocaleDateString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#191927] bg-white border border-[#E8E8EE] hover:bg-[#F3F3F7] rounded-lg transition-colors min-h-[36px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
