import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Note, Goal } from '../../types';
import { formatRelativeOrShortDate } from '../../utils/date';
import { NotePreviewRenderer } from './NotePreviewRenderer';
import { CategoryTag } from '../common/CategoryTag';
import { X, Star, Edit2, Trash2, Clock, Copy, Check, CheckSquare } from 'lucide-react';

interface NoteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  goals?: Goal[];
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
  onUpdateContent?: (noteId: string, updatedContent: string) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  isOpen,
  onClose,
  note,
  goals = [],
  onEdit,
  onDelete,
  onToggleFavorite,
  onUpdateContent,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  const linkedGoal = useMemo(() => {
    if (!note?.linkedGoalId) return null;
    return goals.find((g) => g.id === note.linkedGoalId) || null;
  }, [note?.linkedGoalId, goals]);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
      setCopied(false);
    } else if (previouslyFocusedElementRef.current) {
      previouslyFocusedElementRef.current.focus();
    }
  }, [isOpen]);

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

  if (!isOpen || !note) return null;

  const handleCopyContent = async () => {
    try {
      const textToCopy = `${note.title}\n\n${note.content || ''}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggleCheckbox = (lineIndex: number, newChecked: boolean) => {
    if (!note) return;
    const lines = (note.content || '').split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const match = line.match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
      if (match) {
        const indent = match[1];
        const bullet = match[2];
        const rest = match[4];
        lines[lineIndex] = `${indent}${bullet} [${newChecked ? 'x' : ' '}] ${rest}`;
        const updated = lines.join('\n');
        if (onUpdateContent) {
          onUpdateContent(note.id, updated);
        }
      }
    }
  };

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

  const wordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = note.content ? note.content.length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#191927]/40 backdrop-blur-[2px] transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-detail-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white rounded-xl border border-[#E8E8EE] shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8EE]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#646477] font-medium uppercase tracking-wider">
              Note
            </span>
            <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
            <span className="text-xs text-[#8E8EA0] tabular-nums">
              {formatRelativeOrShortDate(note.updatedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleFavorite(note.id)}
              className={`p-1.5 rounded-md transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
                note.isFavorite
                  ? 'text-[#191927] bg-[#F9E94E]/40'
                  : 'text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7]'
              }`}
              title={note.isFavorite ? 'Unfavorite note' : 'Mark as favorite'}
              aria-label={note.isFavorite ? 'Unfavorite note' : 'Mark note as favorite'}
            >
              <Star
                className="w-4 h-4"
                fill={note.isFavorite ? '#191927' : 'transparent'}
              />
            </button>
            <button
              type="button"
              onClick={handleCopyContent}
              className="p-1.5 rounded-md text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Copy note text"
              aria-label="Copy note text"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#08C83D]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Close note dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <h2
            id="note-detail-title"
            className="text-xl font-bold tracking-tight text-[#191927] break-words"
          >
            {note.title}
          </h2>

          {(note.category || linkedGoal) && (
            <div className="flex items-center gap-3 flex-wrap text-xs text-[#646477]">
              {note.category && <CategoryTag category={note.category} />}
              {linkedGoal && (
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[#08C83D]" aria-hidden="true" />
                  <span>Linked to <strong className="text-[#191927] font-semibold">{linkedGoal.title}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Full content */}
          <div className="p-4 bg-[#FAFAFC] rounded-lg border border-[#E8E8EE] min-h-[140px]">
            <NotePreviewRenderer
              content={note.content}
              interactiveCheckboxes={Boolean(onUpdateContent)}
              onToggleCheckbox={handleToggleCheckbox}
            />
          </div>

          {/* Metadata Bar */}
          <div className="pt-3 border-t border-[#F0F0F4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8E8EA0]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#8E8EA0]" />
                <span>Updated {formatDateTime(note.updatedAt)}</span>
              </span>
              <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
              <span>Created {formatDateTime(note.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
              <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
              <span>{charCount} chars</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E8EE] bg-[#FAFAFC]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(note);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 min-h-[38px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Note</span>
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
                onEdit(note);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] rounded-lg transition-colors min-h-[38px]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
