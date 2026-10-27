import React from 'react';
import { Note, Goal } from '../../types';
import { formatRelativeOrShortDate } from '../../utils/date';
import { CategoryTag } from '../common/CategoryTag';
import { Star, Edit3, Trash2, CheckSquare, Maximize2 } from 'lucide-react';

interface NoteRowProps {
  note: Note;
  linkedGoal?: Goal | null;
  onOpenEditor: (note: Note) => void;
  onOpenDetails: (note: Note) => void;
  onEditInModal: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
}

export const NoteRow: React.FC<NoteRowProps> = ({
  note,
  linkedGoal,
  onOpenEditor,
  onOpenDetails,
  onEditInModal,
  onDeleteNote,
  onToggleFavorite,
}) => {
  const wordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;

  const cleanSnippet = note.content
    ? note.content
        .split('\n')
        .map((l) => l.replace(/^[#>*-\s[xX\]]+/, '').trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(' ')
    : 'No additional text';

  return (
    <tr
      tabIndex={0}
      onClick={() => onOpenEditor(note)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenEditor(note);
        }
      }}
      className="group border-b border-[#E8E8EE] hover:bg-[#FAFAFC] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#191927]"
    >
      {/* Favorite Toggle Column */}
      <td
        className="w-10 px-3 py-3 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleFavorite(note.id)}
          className="p-1 rounded text-[#8E8EA0] hover:text-[#191927] transition-colors min-h-[30px] min-w-[30px] inline-flex items-center justify-center"
          title={note.isFavorite ? 'Unfavorite' : 'Mark as favorite'}
          aria-label={note.isFavorite ? `Unfavorite note "${note.title}"` : `Mark note "${note.title}" as favorite`}
        >
          <Star
            className="w-4 h-4"
            fill={note.isFavorite ? '#F9E94E' : 'transparent'}
            stroke={note.isFavorite ? '#191927' : 'currentColor'}
          />
        </button>
      </td>

      {/* Title & Preview */}
      <td className="px-4 py-3 min-w-[240px]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#191927] group-hover:text-black line-clamp-1">
              {note.title}
            </span>
            {note.category && <CategoryTag category={note.category} />}
          </div>
          <span className="text-[11px] text-[#646477] line-clamp-1 mt-0.5">
            {cleanSnippet}
          </span>
        </div>
      </td>

      {/* Linked Goal - Clean Unboxed Metadata */}
      <td className="hidden sm:table-cell px-4 py-3 text-xs text-[#646477]">
        {linkedGoal ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#191927] max-w-[180px] truncate">
            <CheckSquare className="w-3 h-3 text-[#08C83D] shrink-0" aria-hidden="true" />
            <span className="truncate">{linkedGoal.title}</span>
          </span>
        ) : (
          <span className="text-[11px] text-[#8E8EA0]">—</span>
        )}
      </td>

      {/* Updated Date */}
      <td className="hidden md:table-cell px-4 py-3 text-xs text-[#8E8EA0] tabular-nums whitespace-nowrap">
        {formatRelativeOrShortDate(note.updatedAt)}
      </td>

      {/* Word Count */}
      <td className="hidden lg:table-cell px-4 py-3 text-xs text-[#8E8EA0] tabular-nums whitespace-nowrap">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </td>

      {/* Actions */}
      <td
        className="px-4 py-3 text-right whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onOpenDetails(note)}
            className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#EFEFF5] rounded transition-colors min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
            title="Read note"
            aria-label={`View full note details for "${note.title}"`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEditInModal(note)}
            className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#EFEFF5] rounded transition-colors min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
            title="Edit note"
            aria-label={`Edit note "${note.title}" in modal`}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteNote(note)}
            className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded transition-colors min-h-[28px] min-w-[28px] inline-flex items-center justify-center"
            title="Delete note"
            aria-label={`Delete note "${note.title}"`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
