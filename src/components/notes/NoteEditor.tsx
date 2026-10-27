import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note, Goal } from '../../types';
import { NotePreviewRenderer } from './NotePreviewRenderer';
import {
  ArrowLeft,
  Star,
  Copy,
  Check,
  Trash2,
  Columns,
  Eye,
  Edit2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Clock,
  Target,
  Tag,
} from 'lucide-react';
import { Category } from '../../types';

interface NoteEditorProps {
  note: Note | null; // null means creating a new note
  goals: Goal[];
  categories?: Category[];
  onSave: (noteData: {
    id?: string;
    title: string;
    content: string;
    isFavorite: boolean;
    linkedGoalId?: string | null;
    categoryId?: string | null;
    category?: string | null;
  }) => Note | Promise<Note | void> | void;
  onClose: () => void;
  onDeleteNote: (note: Note) => void;
  onToggleFavorite?: (noteId: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  goals,
  categories = [],
  onSave,
  onClose,
  onDeleteNote,
}) => {
  const [currentId, setCurrentId] = useState<string | undefined>(note?.id);
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [linkedGoalId, setLinkedGoalId] = useState<string | null>(
    note?.linkedGoalId || null
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    note?.categoryId || null
  );
  const [category, setCategory] = useState<string | null>(
    note?.category || null
  );

  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if note changes externally
  useEffect(() => {
    if (note) {
      setCurrentId(note.id);
      setTitle(note.title);
      setContent(note.content || '');
      setIsFavorite(note.isFavorite);
      setLinkedGoalId(note.linkedGoalId || null);
      setCategoryId(note.categoryId || null);
      setCategory(note.category || null);
      setSaveStatus('saved');
    } else {
      setCurrentId(undefined);
      setTitle('');
      setContent('');
      setIsFavorite(false);
      setLinkedGoalId(null);
      setCategoryId(null);
      setCategory(null);
      setSaveStatus('saved');
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [note?.id]);

  // Handle immediate or debounced autosave
  const triggerSave = useCallback(
    (
      newTitle?: string,
      newContent?: string,
      newFav?: boolean,
      newGoalId?: string | null,
      newCatId?: string | null,
      newCatName?: string | null
    ) => {
      const actualTitle = newTitle !== undefined ? newTitle : title;
      const actualContent = newContent !== undefined ? newContent : content;
      const actualFav = newFav !== undefined ? newFav : isFavorite;
      const actualGoalId = newGoalId !== undefined ? newGoalId : linkedGoalId;
      const actualCatId = newCatId !== undefined ? newCatId : categoryId;
      const actualCatName = newCatName !== undefined ? newCatName : category;

      // Don't save if it's a new note and both title and content are blank
      if (!currentId && !actualTitle.trim() && !actualContent.trim()) {
        return;
      }

      const trimmedTitle = actualTitle.trim() || 'Untitled Note';
      setSaveStatus('saving');
      const saved = onSave({
        id: currentId,
        title: trimmedTitle,
        content: actualContent,
        isFavorite: actualFav,
        linkedGoalId: actualGoalId,
        categoryId: actualCatId,
        category: actualCatName,
      });

      if (saved && typeof saved === 'object') {
        if ('then' in saved) {
          (saved as Promise<Note | void>)
            .then((resolved) => {
              if (resolved && resolved.id) {
                setCurrentId(resolved.id);
              }
              setSaveStatus('saved');
            })
            .catch(() => {
              setSaveStatus('unsaved');
            });
          return;
        } else if ('id' in saved && saved.id) {
          setCurrentId(saved.id);
        }
      }

      setTimeout(() => setSaveStatus('saved'), 400);
    },
    [currentId, title, content, isFavorite, linkedGoalId, categoryId, category, onSave]
  );

  const scheduleAutoSave = (
    nextTitle?: string,
    nextContent?: string,
    nextFav?: boolean,
    nextGoalId?: string | null,
    nextCatId?: string | null,
    nextCatName?: string | null
  ) => {
    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      triggerSave(nextTitle, nextContent, nextFav, nextGoalId, nextCatId, nextCatName);
    }, 700);
  };

  const handleClose = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    // Flush any pending unsaved changes before exiting
    if (title.trim() || content.trim()) {
      triggerSave(title, content, isFavorite, linkedGoalId, categoryId, category);
    }
    onClose();
  }, [title, content, isFavorite, linkedGoalId, categoryId, category, triggerSave, onClose]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Global Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (
          document.activeElement === textareaRef.current ||
          document.activeElement === titleInputRef.current
        ) {
          (document.activeElement as HTMLElement).blur();
          return;
        }
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Text insertion helper for markdown actions
  const insertFormatting = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;

    const before = content.substring(0, start);
    const after = content.substring(end);

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = `${before}${replacement}${after}`;

    setContent(newContent);
    scheduleAutoSave(title, newContent, isFavorite, linkedGoalId);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const insertLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = content.substring(0, start);
    const after = content.substring(start);

    // Find start of current line
    const lastNewline = before.lastIndexOf('\n');
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const linePrefixBefore = content.substring(0, lineStart);
    const lineContent = content.substring(lineStart);

    const newContent = `${linePrefixBefore}${prefix} ${lineContent}`;
    setContent(newContent);
    scheduleAutoSave(title, newContent, isFavorite, linkedGoalId);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Keyboard shortcut handlers (Cmd+B, Cmd+I, Cmd+K, Cmd+S, Tab key)
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      triggerSave(title, content, isFavorite, linkedGoalId);
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      insertFormatting('**', '**', 'bold text');
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      insertFormatting('*', '*', 'italic text');
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      insertFormatting('[', '](https://)', 'link title');
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      scheduleAutoSave(title, newContent, isFavorite, linkedGoalId);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Checkbox toggle inside markdown content (supports - [ ] and * [ ])
  const handleToggleCheckbox = (lineIndex: number, newChecked: boolean) => {
    const lines = content.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const match = line.match(/^(\s*)([-*])\s*\[([ xX])\]\s*(.*)$/);
      if (match) {
        const indent = match[1];
        const bullet = match[2];
        const rest = match[4];
        lines[lineIndex] = `${indent}${bullet} [${newChecked ? 'x' : ' '}] ${rest}`;
        const updated = lines.join('\n');
        setContent(updated);
        triggerSave(title, updated, isFavorite, linkedGoalId);
      }
    }
  };

  // Copy full note
  const handleCopyNote = async () => {
    try {
      const textToCopy = `${title || 'Untitled Note'}\n\n${content}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Calculations
  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="bg-white min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top Header / Action Bar */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur-xs border-b border-[#E8E8EE] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded-lg transition-colors shrink-0"
            aria-label="Back to notes list"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <span className="text-[#D0D0DC] hidden sm:inline">/</span>

          <span className="text-xs font-medium text-[#191927] truncate max-w-[110px] sm:max-w-xs">
            {title.trim() || 'Untitled Note'}
          </span>

          {/* Save Status */}
          <span className="text-[11px] text-[#8E8EA0] flex items-center gap-1 shrink-0 ml-0.5 sm:ml-1">
            {saveStatus === 'saving' ? (
              <span className="text-[#646477]">Saving...</span>
            ) : saveStatus === 'unsaved' ? (
              <span className="text-amber-600">Unsaved</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#08C83D]">
                <Check className="w-3 h-3" />
                <span className="hidden md:inline text-[11px]">Saved</span>
              </span>
            )}
          </span>
        </div>

        {/* Center: View Switcher (Edit, Split, Preview) */}
        <div
          className="inline-flex items-center p-0.5 bg-[#F3F3F7] rounded-lg border border-[#E8E8EE] shrink-0"
          role="group"
          aria-label="Editor view mode"
        >
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'edit'
                ? 'bg-white text-[#191927] shadow-xs'
                : 'text-[#646477] hover:text-[#191927]'
            }`}
            title="Edit mode"
            aria-pressed={viewMode === 'edit'}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Write</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden md:flex p-1.5 rounded-md text-xs font-medium transition-colors items-center gap-1 ${
              viewMode === 'split'
                ? 'bg-white text-[#191927] shadow-xs'
                : 'text-[#646477] hover:text-[#191927]'
            }`}
            title="Split view (Editor and Preview side by side)"
            aria-pressed={viewMode === 'split'}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="text-[11px]">Split</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
              viewMode === 'preview'
                ? 'bg-white text-[#191927] shadow-xs'
                : 'text-[#646477] hover:text-[#191927]'
            }`}
            title="Preview formatted note"
            aria-pressed={viewMode === 'preview'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Preview</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isFavorite;
              setIsFavorite(next);
              triggerSave(title, content, next, linkedGoalId);
            }}
            className={`p-1.5 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
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

          {/* Copy Note */}
          <button
            type="button"
            onClick={handleCopyNote}
            className="p-1.5 text-[#646477] hover:text-[#191927] hover:bg-[#F3F3F7] rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            title="Copy note text"
            aria-label="Copy note content"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[#08C83D]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Delete Note (if existing note or has currentId) */}
          {(note || currentId) && (
            <button
              type="button"
              onClick={() =>
                onDeleteNote(
                  note || {
                    id: currentId!,
                    title: title || 'Untitled Note',
                    content,
                    isFavorite,
                    linkedGoalId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                )
              }
              className="p-1.5 text-[#646477] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Delete note"
              aria-label="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Done Button */}
          <button
            type="button"
            onClick={handleClose}
            className="px-3 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-[#191927] hover:bg-[#2B2B40] rounded-lg transition-colors min-h-[32px]"
          >
            Done
          </button>
        </div>
      </div>

      {/* Formatting & Linking Toolbar (Shown in edit or split modes) */}
      {viewMode !== 'preview' && (
        <div className="border-b border-[#F0F0F4] bg-[#FAFAFC] px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
          {/* Markdown action buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'bold text')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Bold (Cmd+B)"
              aria-label="Bold text"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'italic text')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Italic (Cmd+I)"
              aria-label="Italic text"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <span aria-hidden="true" className="text-[#D0D0DC] mx-0.5">|</span>
            <button
              type="button"
              onClick={() => insertLinePrefix('#')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Heading 1"
              aria-label="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('##')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Heading 2"
              aria-label="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <span aria-hidden="true" className="text-[#D0D0DC] mx-0.5">|</span>
            <button
              type="button"
              onClick={() => insertLinePrefix('-')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Bulleted List"
              aria-label="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('- [ ]')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Task Checklist"
              aria-label="Task checklist"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('>')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Blockquote"
              aria-label="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('```\n', '\n```', 'code block')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Code Block"
              aria-label="Code block"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('\n---\n')}
              className="p-1 text-[#646477] hover:text-[#191927] hover:bg-white rounded transition-colors"
              title="Horizontal Divider"
              aria-label="Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Goal Linker Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-[#646477]">
            <Target className="w-3.5 h-3.5 text-[#8E8EA0]" aria-hidden="true" />
            <label htmlFor="link-goal-select" className="text-[11px] font-medium text-[#646477]">
              Link Goal:
            </label>
            <select
              id="link-goal-select"
              value={linkedGoalId || ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setLinkedGoalId(val);
                triggerSave(title, content, isFavorite, val, categoryId, category);
              }}
              className="text-xs bg-white border border-[#E8E8EE] rounded-md px-2 py-0.5 text-[#191927] focus:outline-none focus:border-[#191927] cursor-pointer max-w-[150px] sm:max-w-xs truncate"
            >
              <option value="">None (Unlinked)</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#646477]">
              <Tag className="w-3.5 h-3.5 text-[#8E8EA0]" aria-hidden="true" />
              <label htmlFor="note-category-select" className="text-[11px] font-medium text-[#646477]">
                Category:
              </label>
              <select
                id="note-category-select"
                value={categoryId || ''}
                onChange={(e) => {
                  const val = e.target.value || null;
                  const selectedCat = categories.find((c) => c.id === val);
                  const catName = selectedCat ? selectedCat.name : null;
                  setCategoryId(val);
                  setCategory(catName);
                  triggerSave(title, content, isFavorite, linkedGoalId, val, catName);
                }}
                className="text-xs bg-white border border-[#E8E8EE] rounded-md px-2 py-0.5 text-[#191927] focus:outline-none focus:border-[#191927] cursor-pointer max-w-[150px] sm:max-w-xs truncate"
              >
                <option value="">None (Unassigned)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Editor Body Area */}
      <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#E8E8EE]">
        {/* Left: Writing Area (Visible in Edit or Split mode) */}
        {viewMode !== 'preview' && (
          <div
            className={`flex-1 flex flex-col p-4 sm:p-8 max-w-4xl mx-auto w-full ${
              viewMode === 'split' ? 'md:max-w-none md:w-1/2' : ''
            }`}
          >
            {/* Title Input */}
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => {
                const next = e.target.value;
                setTitle(next);
                scheduleAutoSave(next, content, isFavorite, linkedGoalId);
              }}
              placeholder="Untitled Note"
              className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-[#191927] placeholder:text-[#D0D0DC] border-none outline-none focus:ring-0 mb-4 bg-transparent"
              aria-label="Note title"
            />

            {/* Note Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                const next = e.target.value;
                setContent(next);
                scheduleAutoSave(title, next, isFavorite, linkedGoalId);
              }}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Start typing your note here... Supports markdown: # headings, **bold**, *italic*, - lists, - [ ] checklists, > quotes, and ```code```."
              className="w-full flex-1 min-h-[380px] text-sm leading-relaxed text-[#191927] placeholder:text-[#8E8EA0] border-none outline-none focus:ring-0 resize-none font-normal bg-transparent"
              aria-label="Note content"
            />
          </div>
        )}

        {/* Right: Preview Area (Visible in Preview or Split mode) */}
        {viewMode !== 'edit' && (
          <div
            className={`flex-1 flex flex-col p-4 sm:p-8 overflow-y-auto max-w-4xl mx-auto w-full bg-[#FAFAFC]/50 ${
              viewMode === 'split' ? 'md:max-w-none md:w-1/2' : ''
            }`}
          >
            <div className="mb-4 pb-2 border-b border-[#F0F0F4]">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191927] break-words">
                {title.trim() || 'Untitled Note'}
              </h1>
              <div className="mt-2 flex items-center gap-3 text-xs text-[#646477] flex-wrap">
                {category && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 border border-[#191927]/20"
                      style={{
                        backgroundColor:
                          categories.find((c) => c.id === categoryId || c.name === category)?.color ||
                          '#08C83D',
                      }}
                      aria-hidden="true"
                    />
                    <span>
                      Category: <strong>{category}</strong>
                    </span>
                  </div>
                )}
                {linkedGoalId && (
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#08C83D]" />
                    <span>
                      Linked to:{' '}
                      <strong>
                        {goals.find((g) => g.id === linkedGoalId)?.title || 'Goal'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <NotePreviewRenderer
              content={content}
              interactiveCheckboxes={true}
              onToggleCheckbox={handleToggleCheckbox}
              className="flex-1"
            />
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="border-t border-[#E8E8EE] bg-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8E8EA0]">
        <div className="flex items-center gap-3 tabular-nums">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
          <span>{charCount} characters</span>
          <span aria-hidden="true" className="text-[#D0D0DC]">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#8E8EA0]" />
            <span>~{readingTimeMinutes} min read</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8E8EA0]">
            Use <kbd className="px-1 py-0.5 bg-[#F3F3F7] border border-[#E8E8EE] rounded text-[10px] font-mono">Cmd+S</kbd> to save
          </span>
        </div>
      </div>
    </div>
  );
};
