import React, { useState, useMemo } from 'react';
import { Note, Goal, NoteSortOption, Category } from '../../types';
import { filterNotes, sortNotes } from '../../utils/calculations';
import { NotesSummary } from './NotesSummary';
import { NotesToolbar } from './NotesToolbar';
import { NoteCard } from './NoteCard';
import { NoteRow } from './NoteRow';
import { NoteEditor } from './NoteEditor';
import { EmptyState } from '../common/EmptyState';
import { Plus, FileText, SearchX } from 'lucide-react';

interface NotesScreenProps {
  notes: Note[];
  goals: Goal[];
  categories?: Category[];
  initialCategoryFilter?: string;
  initialViewMode?: 'grid' | 'list';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onNewNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onToggleFavorite: (noteId: string) => void;
  onSaveNote: (noteData: {
    id?: string;
    title: string;
    content: string;
    isFavorite: boolean;
    linkedGoalId?: string | null;
    categoryId?: string | null;
    category?: string | null;
  }) => Note | Promise<Note | void> | void;
  onOpenDetails: (note: Note) => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  notes,
  goals,
  categories = [],
  initialCategoryFilter,
  initialViewMode = 'grid',
  searchQuery = '',
  onSearchChange,
  onNewNote,
  onEditNote,
  onDeleteNote,
  onToggleFavorite,
  onSaveNote,
  onOpenDetails,
}) => {
  // Local or propagated search
  const [internalSearch, setInternalSearch] = useState('');
  const activeSearch = searchQuery !== undefined ? searchQuery : internalSearch;
  const handleSearchChange = onSearchChange || setInternalSearch;

  // Filter & Layout states
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter || 'All');
  const [sortOption, setSortOption] = useState<NoteSortOption>('recently-updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);

  // Keep category filter in sync if navigated with a specific category
  React.useEffect(() => {
    if (initialCategoryFilter !== undefined) {
      setCategoryFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Keep view mode in sync if workspace preference changes
  React.useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  // Dedicated Editor mode state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeEditorNote, setActiveEditorNote] = useState<Note | null>(null);

  // Goal lookup map
  const goalsMap = useMemo(() => {
    const map = new Map<string, Goal>();
    for (const g of goals) {
      map.set(g.id, g);
    }
    return map;
  }, [goals]);

  // Combined filter pipeline
  const filteredNotes = useMemo(() => {
    return filterNotes(notes, activeSearch, favoritesOnly, categoryFilter);
  }, [notes, activeSearch, favoritesOnly, categoryFilter]);

  // Deterministic sorting
  const sortedAndFilteredNotes = useMemo(() => {
    return sortNotes(filteredNotes, sortOption);
  }, [filteredNotes, sortOption]);

  const hasActiveFilters =
    Boolean(activeSearch.trim()) || favoritesOnly || (categoryFilter && categoryFilter !== 'All');

  const handleClearFilters = () => {
    handleSearchChange('');
    setFavoritesOnly(false);
    setCategoryFilter('All');
  };

  const handleOpenEditor = (note: Note) => {
    setActiveEditorNote(note);
    setIsEditorOpen(true);
  };

  const handleCreateNewInEditor = () => {
    setActiveEditorNote(null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setActiveEditorNote(null);
  };

  // If in dedicated full editor mode, render NoteEditor
  if (isEditorOpen) {
    return (
      <NoteEditor
        note={activeEditorNote}
        goals={goals}
        categories={categories}
        onSave={(data) => {
          const saved = onSaveNote(data);
          if (saved && typeof saved === 'object') {
            if ('then' in saved) {
              (saved as Promise<Note | void>).then((resolved) => {
                if (resolved) setActiveEditorNote(resolved);
              });
            } else {
              setActiveEditorNote(saved as Note);
            }
          }
          return saved;
        }}
        onClose={handleCloseEditor}
        onDeleteNote={(noteToDelete) => {
          handleCloseEditor();
          onDeleteNote(noteToDelete);
        }}
        onToggleFavorite={onToggleFavorite}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191927]">
            Notes
          </h1>
          <p className="text-xs sm:text-sm text-[#646477] mt-0.5">
            Capture ideas, research, plans, and journal reflections in one place.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCreateNewInEditor}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] active:bg-[#141420] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#191927] min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <NotesSummary notes={notes} />

      {/* Search and Filter Toolbar */}
      <NotesToolbar
        searchQuery={activeSearch}
        onSearchChange={handleSearchChange}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyChange={setFavoritesOnly}
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalNotes={notes.length}
        filteredNotesCount={sortedAndFilteredNotes.length}
        onClearFilters={handleClearFilters}
      />

      {/* Notes Display: Empty State OR Grid OR List Table */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E8EE] p-8 sm:p-12 text-center">
          <EmptyState
            icon={FileText}
            heading="No notes yet"
            description="Start capturing your ideas, research, bucket list preparation, and notes here."
            actionLabel="Create Note"
            onAction={handleCreateNewInEditor}
          />
        </div>
      ) : sortedAndFilteredNotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8E8EE] p-8 sm:p-12 text-center">
          <EmptyState
            icon={SearchX}
            heading="No matching notes found"
            description={
              favoritesOnly
                ? "You haven't marked any matching notes as favorites yet."
                : `No notes match "${activeSearch}". Try another search keyword.`
            }
            actionLabel="Clear Filters"
            onAction={handleClearFilters}
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAndFilteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              linkedGoal={note.linkedGoalId ? goalsMap.get(note.linkedGoalId) : null}
              onOpenEditor={handleOpenEditor}
              onOpenDetails={onOpenDetails}
              onEditInModal={onEditNote}
              onDeleteNote={onDeleteNote}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        /* List Table View */
        <div className="bg-white rounded-xl border border-[#E8E8EE] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" aria-label="Notes table">
              <thead>
                <tr className="border-b border-[#E8E8EE] bg-[#FAFAFC] text-[11px] font-semibold text-[#646477] uppercase tracking-wider">
                  <th scope="col" className="w-10 px-3 py-3 text-center">
                    <span className="sr-only">Favorite</span>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Title &amp; Snippet
                  </th>
                  <th scope="col" className="hidden sm:table-cell px-4 py-3">
                    Linked Goal
                  </th>
                  <th scope="col" className="hidden md:table-cell px-4 py-3">
                    Updated
                  </th>
                  <th scope="col" className="hidden lg:table-cell px-4 py-3">
                    Words
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    linkedGoal={note.linkedGoalId ? goalsMap.get(note.linkedGoalId) : null}
                    onOpenEditor={handleOpenEditor}
                    onOpenDetails={onOpenDetails}
                    onEditInModal={onEditNote}
                    onDeleteNote={onDeleteNote}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
