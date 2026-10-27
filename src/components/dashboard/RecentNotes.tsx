import React from 'react';
import { Note } from '../../types';
import { formatRelativeOrShortDate } from '../../utils/date';
import { generateNotePreview } from '../../utils/calculations';
import { CategoryTag } from '../common/CategoryTag';
import { EmptyState } from '../common/EmptyState';
import { FileText, Edit2, Trash2, Star } from 'lucide-react';

interface RecentNotesProps {
  notes: Note[];
  onNewNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
  onExploreNotes?: () => void;
  searchQuery?: string;
}

export const RecentNotes: React.FC<RecentNotesProps> = ({
  notes,
  onNewNote,
  onEditNote,
  onDeleteNote,
  onToggleFavorite,
  onExploreNotes,
  searchQuery = '',
}) => {
  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    return (
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <section className="bg-white border border-[#E8E8EE] rounded-xl overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-[#E8E8EE] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#191927]">Recent Notes</h2>
          <p className="text-xs text-[#646477]">Your latest thoughts and ideas.</p>
        </div>

        {notes.length > 0 && (
          <div className="flex items-center gap-3">
            {onExploreNotes && (
              <button
                type="button"
                onClick={onExploreNotes}
                className="text-xs text-[#646477] hover:text-[#191927] transition-colors"
              >
                View all →
              </button>
            )}
            <button
              type="button"
              onClick={onNewNote}
              className="text-xs font-medium text-[#191927] hover:text-[#2B2B40] underline underline-offset-4 py-1"
            >
              + New Note
            </button>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            heading="Make room for your ideas."
            description="Create a note to capture a thought, plan, or idea."
            actionLabel="Create Your First Note"
            onAction={onNewNote}
          />
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#646477]">
            No notes match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="group p-4 rounded-lg border border-[#E8E8EE] bg-white hover:border-[#191927]/30 hover:bg-[#FAFAFC] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3
                      onClick={() => onEditNote(note)}
                      className="text-sm font-semibold text-[#191927] cursor-pointer hover:underline line-clamp-1"
                    >
                      {note.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(note.id)}
                      className={`p-1.5 rounded-md transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
                        note.isFavorite
                          ? 'text-[#191927]'
                          : 'text-[#8E8EA0] opacity-90 sm:opacity-0 group-hover:opacity-100 hover:text-[#191927]'
                      }`}
                      title={note.isFavorite ? 'Unfavorite' : 'Favorite'}
                      aria-label={note.isFavorite ? 'Unfavorite note' : 'Mark note as favorite'}
                    >
                      <Star
                        className="w-3.5 h-3.5"
                        fill={note.isFavorite ? '#191927' : 'transparent'}
                      />
                    </button>
                  </div>

                  <p
                    onClick={() => onEditNote(note)}
                    className="text-xs text-[#646477] line-clamp-2 leading-relaxed cursor-pointer"
                  >
                    {generateNotePreview(note.content)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#F0F0F4] text-[11px] text-[#8E8EA0]">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums">
                      {formatRelativeOrShortDate(note.updatedAt)}
                    </span>
                    {note.category && (
                      <CategoryTag category={note.category} />
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditNote(note)}
                      className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-white rounded border border-transparent hover:border-[#E8E8EE] transition-all min-h-[30px] min-w-[30px] flex items-center justify-center"
                      aria-label={`Edit note "${note.title}"`}
                      title="Edit note"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(note)}
                      className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-all min-h-[30px] min-w-[30px] flex items-center justify-center"
                      aria-label={`Delete note "${note.title}"`}
                      title="Delete note"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
