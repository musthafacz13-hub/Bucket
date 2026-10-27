import React, { useState, useEffect, useRef } from 'react';
import { Note, Goal, Category } from '../../types';
import { X, Star, Target, Tag } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    id?: string;
    title: string;
    content: string;
    isFavorite: boolean;
    linkedGoalId?: string | null;
    categoryId?: string | null;
    category?: string | null;
  }) => void;
  initialNote?: Note | null;
  goals?: Goal[];
  categories?: Category[];
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
  goals = [],
  categories = [],
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      if (initialNote) {
        setTitle(initialNote.title);
        setContent(initialNote.content || '');
        setIsFavorite(Boolean(initialNote.isFavorite));
        setLinkedGoalId(initialNote.linkedGoalId || null);
        setCategoryId(initialNote.categoryId || null);
        setCategory(initialNote.category || null);
      } else {
        setTitle('');
        setContent('');
        setIsFavorite(false);
        setLinkedGoalId(null);
        setCategoryId(null);
        setCategory(null);
      }
      setError(null);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
    }
  }, [isOpen, initialNote]);

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
      setError('Please provide a note title.');
      titleInputRef.current?.focus();
      return;
    }

    onSave({
      id: initialNote?.id,
      title: trimmedTitle,
      content: content.trim(),
      isFavorite,
      linkedGoalId,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191927]/40 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-xl border border-[#E8E8EE] shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EE]">
          <h2 id="note-modal-title" className="text-sm font-semibold text-[#191927]">
            {initialNote ? 'Edit Note' : 'New Note'}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-1.5 rounded-md transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
                isFavorite
                  ? 'text-[#191927] bg-[#F9E94E]/40'
                  : 'text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7]'
              }`}
              title={isFavorite ? 'Unfavorite' : 'Mark as favorite'}
              aria-label={isFavorite ? 'Unfavorite note' : 'Mark note as favorite'}
            >
              <Star
                className="w-4 h-4"
                fill={isFavorite ? '#191927' : 'transparent'}
              />
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div
              className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="note-title" className="block text-xs font-medium text-[#191927] mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Kyoto travel itinerary ideas"
              className="w-full px-3 py-2 text-sm text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all placeholder:text-[#8E8EA0]"
              required
            />
          </div>

          <div>
            <label htmlFor="note-content" className="block text-xs font-medium text-[#191927] mb-1.5">
              Content / Notes
            </label>
            <textarea
              id="note-content"
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Capture your thoughts, ideas, links, or action items..."
              className="w-full px-3 py-2 text-xs leading-relaxed text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all placeholder:text-[#8E8EA0] resize-y"
            />
          </div>

          {goals.length > 0 && (
            <div>
              <label htmlFor="note-linked-goal" className="block text-xs font-medium text-[#191927] mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#8E8EA0]" />
                <span>Link to Goal (Optional)</span>
              </label>
              <select
                id="note-linked-goal"
                value={linkedGoalId || ''}
                onChange={(e) => setLinkedGoalId(e.target.value || null)}
                className="w-full px-3 py-2 text-xs text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all cursor-pointer"
              >
                <option value="">No linked goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.category})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              {initialNote ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
