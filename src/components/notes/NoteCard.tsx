import React from 'react';
import { Note, Goal } from '../../types';
import { formatRelativeOrShortDate } from '../../utils/date';
import { CategoryTag } from '../common/CategoryTag';
import { Star, Edit3, Trash2, CheckSquare, Maximize2 } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  linkedGoal?: Goal | null;
  onOpenEditor: (note: Note) => void;
  onOpenDetails: (note: Note) => void;
  onEditInModal: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  linkedGoal,
  onOpenEditor,
  onOpenDetails,
  onEditInModal,
  onDeleteNote,
  onToggleFavorite,
}) => {
  const wordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;

  // Clean preview text without raw markdown prefixes for concise card display
  const cleanSnippet = note.content
    ? note.content
        .split('\n')
        .map((l) => l.replace(/^[#>*-\s[xX\]]+/, '').trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(' ')
    : '';

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={() => onOpenEditor(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenEditor(note);
        }
      }}
      className="group bg-white rounded-xl border border-[#E8E8EE] hover:border-[#191927] transition-all p-4 flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#191927] hover:shadow-xs relative"
    >
      <div>
        {/* Top Header: Title and Favorite */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-[#191927] group-hover:text-black line-clamp-2 leading-snug">
            {note.title}
          </h3>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(note.id);
            }}
            className={`p-1.5 rounded-md transition-colors shrink-0 min-h-[30px] min-w-[30px] flex items-center justify-center ${
              note.isFavorite
                ? 'text-[#191927]'
                : 'text-[#D0D0DC] hover:text-[#191927] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            }`}
            title={note.isFavorite ? 'Unfavorite note' : 'Mark as favorite'}
            aria-label={note.isFavorite ? `Unfavorite note "${note.title}"` : `Mark note "${note.title}" as favorite`}
          >
            <Star
              className="w-4 h-4"
              fill={note.isFavorite ? '#F9E94E' : 'transparent'}
            />
          </button>
        </div>

        {/* Category & Linked Goal - Clean Metadata */}
        {(note.category || linkedGoal) && (
          <div className="mb-2.5 flex items-center gap-2 flex-wrap">
            {note.category && (
              <CategoryTag category={note.category} />
            )}
            {linkedGoal && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#646477]">
                <CheckSquare className="w-3 h-3 text-[#08C83D] shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[160px] font-medium">{linkedGoal.title}</span>
              </div>
            )}
          </div>
        )}

        {/* Content Snippet */}
        <p className="text-xs text-[#646477] leading-relaxed line-clamp-3 mb-4 min-h-[3rem]">
          {cleanSnippet || (
            <span className="text-[#8E8EA0] italic">Empty note. Click to start typing...</span>
          )}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-[#F0F0F4] flex items-center justify-between text-[11px] text-[#8E8EA0]">
        <div className="flex items-center gap-2 tabular-nums">
          <span>{formatRelativeOrShortDate(note.updatedAt)}</span>
          <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        </div>

        {/* Quick actions on card */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onOpenDetails(note)}
            className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Read note"
            aria-label={`View full note details for "${note.title}"`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEditInModal(note)}
            className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Edit note metadata"
            aria-label={`Quick edit note "${note.title}"`}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteNote(note)}
            className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Delete note"
            aria-label={`Delete note "${note.title}"`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
