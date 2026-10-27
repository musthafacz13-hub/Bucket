import React, { useEffect, useRef } from 'react';
import { Category } from '../../types';
import { AlertTriangle, X } from 'lucide-react';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: Category | null;
  associatedGoalsCount: number;
  associatedNotesCount: number;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  category,
  associatedGoalsCount,
  associatedNotesCount,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);
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
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  const totalAssociated = associatedGoalsCount + associatedNotesCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191927]/40 backdrop-blur-[2px] transition-opacity"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
      aria-describedby="delete-category-description"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-xl border border-[#E8E8EE] shadow-lg overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 id="delete-category-title" className="text-sm font-semibold text-[#191927]">
              Delete Category
            </h2>
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

        {/* Content */}
        <div className="p-6 space-y-3.5">
          <p className="text-xs text-[#191927] leading-relaxed">
            Are you sure you want to delete the category{' '}
            <strong className="inline-flex items-center gap-1.5 font-semibold text-[#191927]">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0 border border-[#191927]/20"
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              &ldquo;{category.name}&rdquo;
            </strong>
            ?
          </p>

          <div
            id="delete-category-description"
            className="text-xs text-[#646477] leading-relaxed bg-[#FAFAFC] p-3.5 rounded-lg border border-[#E8E8EE] space-y-1.5"
          >
            {totalAssociated > 0 ? (
              <p>
                This category is currently assigned to{' '}
                <strong className="text-[#191927] font-semibold">
                  {associatedGoalsCount} {associatedGoalsCount === 1 ? 'goal' : 'goals'}
                </strong>{' '}
                and{' '}
                <strong className="text-[#191927] font-semibold">
                  {associatedNotesCount} {associatedNotesCount === 1 ? 'note' : 'notes'}
                </strong>
                .
              </p>
            ) : (
              <p>No goals or notes are currently assigned to this category.</p>
            )}
            <p className="text-[#8E8EA0] text-[11px]">
              Deleting this category will remove the category assignment from these items. Your
              goals and notes will <strong>not</strong> be deleted.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[#E8E8EE] bg-[#FAFAFC]">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded-lg transition-colors min-h-[38px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 min-h-[38px]"
          >
            Delete Category
          </button>
        </div>
      </div>
    </div>
  );
};
