import React, { useState, useEffect, useRef } from 'react';
import { Category } from '../../types';
import { X, Check } from 'lucide-react';

export const APPROVED_CATEGORY_COLORS = [
  { name: 'Green', hex: '#08C83D' },
  { name: 'Light Blue', hex: '#A9C9F5' },
  { name: 'Pink', hex: '#F6C6DA' },
  { name: 'Yellow', hex: '#F9E94E' },
  { name: 'Dark Navy', hex: '#191927' },
  { name: 'Slate', hex: '#646477' },
];

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: {
    id?: string;
    name: string;
    color: string;
  }) => void;
  initialCategory?: Category | null;
  existingCategories: Category[];
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  existingCategories,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(APPROVED_CATEGORY_COLORS[0].hex);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      if (initialCategory) {
        setName(initialCategory.name);
        setColor(initialCategory.color || APPROVED_CATEGORY_COLORS[0].hex);
      } else {
        setName('');
        setColor(APPROVED_CATEGORY_COLORS[0].hex);
      }
      setError(null);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    } else if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
    }
  }, [isOpen, initialCategory]);

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
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Please provide a category name.');
      nameInputRef.current?.focus();
      return;
    }

    const reserved = ['all', 'unassigned'];
    if (reserved.includes(trimmed.toLowerCase())) {
      setError(`"${trimmed}" is a reserved filter name. Please choose another category name.`);
      nameInputRef.current?.focus();
      return;
    }

    // Check duplicate name (case-insensitive and whitespace-trimmed) excluding self
    const isDuplicate = existingCategories.some(
      (c) =>
        c.name.toLowerCase().trim() === trimmed.toLowerCase() &&
        c.id !== initialCategory?.id
    );

    if (isDuplicate) {
      setError(`A category named "${trimmed}" already exists.`);
      nameInputRef.current?.focus();
      return;
    }

    const safeColor =
      typeof color === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim())
        ? color.trim()
        : APPROVED_CATEGORY_COLORS[0].hex;

    onSave({
      id: initialCategory?.id,
      name: trimmed,
      color: safeColor,
    });
    onClose();
  };

  const isEditing = Boolean(initialCategory);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191927]/40 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-xl border border-[#E8E8EE] shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EE]">
          <h2 id="category-modal-title" className="text-sm font-semibold text-[#191927]">
            {isEditing ? 'Edit Category' : 'Create Category'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Category Name */}
          <div>
            <label
              htmlFor="category-name-input"
              className="block text-xs font-medium text-[#191927] mb-1.5"
            >
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              id="category-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Travel, Fitness, Learning"
              className="w-full px-3 py-2 text-sm text-[#191927] bg-white border border-[#E8E8EE] rounded-lg focus:outline-none focus:border-[#191927] focus:ring-1 focus:ring-[#191927] transition-all placeholder:text-[#8E8EA0]"
              required
            />
          </div>

          {/* Color Picker */}
          <div>
            <label
              id="category-color-label"
              className="block text-xs font-medium text-[#191927] mb-2"
            >
              Accent Color
            </label>
            <div
              role="radiogroup"
              aria-labelledby="category-color-label"
              className="flex items-center gap-2.5 flex-wrap"
            >
              {APPROVED_CATEGORY_COLORS.map((c) => {
                const isSelected = color.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Color ${c.name} (${c.hex})`}
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer border border-[#191927]/20 ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-[#191927] scale-110 shadow-xs'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {isSelected && (
                      <Check
                        className={`w-4 h-4 ${
                          c.hex === '#191927' || c.hex === '#646477'
                            ? 'text-white'
                            : 'text-[#191927]'
                        }`}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#8E8EA0] mt-1.5">
              Selected palette matches Bucket design system standards.
            </p>
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
              disabled={!name.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] disabled:bg-[#D0D0DC] disabled:cursor-not-allowed rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191927] min-h-[38px]"
            >
              {isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
