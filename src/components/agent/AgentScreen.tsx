import React, { FormEvent, useMemo, useRef, useState } from 'react';
import {
  Check,
  CircleAlert,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AgentScreenProps {
  onRefreshWorkspace: () => Promise<void>;
}

type MessageRole = 'user' | 'assistant' | 'error';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
}

interface PendingConfirmation {
  tool: string;
  args: Record<string, unknown>;
  description: string;
}

interface AgentResponse {
  reply?: string;
  actions?: Array<{ tool: string; ok: boolean; summary: string; replayed?: boolean }>;
  pending_confirmation?: PendingConfirmation;
  request_id?: string;
}

const WRITE_TOOLS = new Set([
  'create_goal',
  'update_goal',
  'create_note',
  'update_note',
  'create_category',
  'rename_category',
  'move_goal_to_category',
  'move_note_to_category',
  'delete_goal',
  'delete_note',
  'delete_category',
]);

const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      return context
        .clone()
        .json()
        .then((body: { error?: { message?: string } }) => body?.error?.message || fallback)
        .catch(() => fallback);
    }
  }
  if (error instanceof Error && error.message) return Promise.resolve(error.message);
  return Promise.resolve(fallback);
};

export const AgentScreen: React.FC<AgentScreenProps> = ({ onRefreshWorkspace }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasConversation = messages.length > 0;
  const history = useMemo(
    () => messages.filter((message) => message.role !== 'error').map(({ role, text }) => ({ role, text })),
    [messages]
  );

  const appendMessage = (role: MessageRole, text: string) => {
    setMessages((current) => [...current, { id: newId(), role, text }]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }));
  };

  const invokeBlade = async (body: Record<string, unknown>): Promise<AgentResponse> => {
    if (!supabase) {
      throw new Error('Supabase is not configured for this deployment. Blade AI cannot be reached yet.');
    }

    const { data, error: invokeError } = await supabase.functions.invoke('blade-ai', { body });
    if (invokeError) {
      const message = await getErrorMessage(invokeError, 'Blade AI could not process this request.');
      throw new Error(message);
    }
    if (!data || typeof data !== 'object') {
      throw new Error('Blade AI returned an invalid response.');
    }
    return data as AgentResponse;
  };

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || isSending || isConfirming) return;

    const requestId = newId();
    setDraft('');
    setError(null);
    setPending(null);
    appendMessage('user', message);
    setIsSending(true);

    try {
      const response = await invokeBlade({
        message,
        request_id: requestId,
        history: [...history, { role: 'user', text: message }].slice(-10),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      if (response.reply) appendMessage('assistant', response.reply);
      if (response.pending_confirmation) setPending(response.pending_confirmation);
      if (response.actions?.some((action) => action.ok && WRITE_TOOLS.has(action.tool))) {
        await onRefreshWorkspace();
      }
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'Blade AI could not process this request.';
      setError(messageText);
      appendMessage('error', messageText);
    } finally {
      setIsSending(false);
    }
  };

  const confirmAction = async () => {
    if (!pending || isConfirming) return;
    setError(null);
    setIsConfirming(true);
    try {
      const response = await invokeBlade({
        request_id: newId(),
        confirm: pending,
      });
      if (response.reply) appendMessage('assistant', response.reply);
      if (response.actions?.some((action) => action.ok && WRITE_TOOLS.has(action.tool))) {
        await onRefreshWorkspace();
      }
      setPending(null);
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'The confirmed action could not be completed.';
      setError(messageText);
      appendMessage('error', messageText);
    } finally {
      setIsConfirming(false);
    }
  };

  const clearConversation = () => {
    if (isSending || isConfirming) return;
    setMessages([]);
    setPending(null);
    setError(null);
    setDraft('');
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex items-start justify-between gap-4 border-b border-[#E8E8EE] pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#191927] text-white">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-[#191927]">Blade AI</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#646477]">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" /> Workspace assistant
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#646477] sm:text-sm">
              Ask about your goals and notes, or request an organized change to your workspace.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearConversation}
          disabled={!hasConversation || isSending || isConfirming}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#E8E8EE] px-2.5 py-2 text-xs font-medium text-[#646477] transition-colors hover:bg-[#FAFAFC] hover:text-[#191927] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-6" aria-live="polite">
        {!hasConversation ? (
          <div className="flex min-h-[360px] items-center justify-center px-4 text-center">
            <div className="max-w-md">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-[#E8E8EE] text-[#646477]">
                <MessageSquareText className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[#191927]">What would you like to work on?</h2>
              <p className="mt-2 text-sm leading-6 text-[#646477]">
                Blade AI can search your workspace, summarize goals, and propose changes. It will ask
                before deleting anything.
              </p>
              <p className="mt-4 text-xs leading-5 text-[#8E8EA0]">
                Your request is sent to the authenticated Blade AI function. No local or fabricated conversation is used.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 sm:max-w-[78%] ${
                    message.role === 'user'
                      ? 'bg-[#191927] text-white'
                      : message.role === 'error'
                        ? 'border border-[#FDDAD7] bg-[#FFF4F2] text-[#BC1C24]'
                        : 'border border-[#E8E8EE] bg-white text-[#191927]'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#646477]">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Blade AI is checking your workspace...
              </div>
            )}
          </div>
        )}
      </div>

      {pending && (
        <div className="mb-4 border border-[#E8E8EE] bg-[#FAFAFC] px-4 py-4" role="alert">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#191927]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#191927]">Confirmation required</p>
              <p className="mt-1 text-sm leading-6 text-[#646477]">{pending.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={confirmAction}
                  disabled={isConfirming}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#191927] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2C2C3F] disabled:cursor-wait disabled:opacity-60"
                >
                  {isConfirming ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Confirm action
                </button>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  disabled={isConfirming}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E8E8EE] bg-white px-3 py-2 text-xs font-semibold text-[#646477] hover:text-[#191927] disabled:opacity-60"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !hasConversation && (
        <div className="mb-4 flex items-center gap-2 border border-[#FDDAD7] bg-[#FFF4F2] px-3 py-2 text-xs text-[#BC1C24]" role="alert">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto p-1" aria-label="Dismiss error">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={sendMessage} className="mx-auto w-full max-w-3xl border border-[#E8E8EE] bg-white p-2 shadow-[0_12px_35px_-28px_rgba(25,25,39,0.4)]">
        <div className="flex items-end gap-2">
          <label htmlFor="blade-ai-message" className="sr-only">Message Blade AI</label>
          <textarea
            id="blade-ai-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder="Ask about your goals or notes..."
            disabled={isSending || isConfirming}
            className="min-h-12 flex-1 resize-none border-0 px-2 py-2 text-sm text-[#191927] outline-none placeholder:text-[#8E8EA0] disabled:cursor-not-allowed disabled:bg-white"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending || isConfirming}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#191927] text-white transition-colors hover:bg-[#2C2C3F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#191927] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between px-2 pb-1 pt-1 text-[10px] text-[#8E8EA0]">
          <span>Enter to send · Shift+Enter for a new line</span>
          <span>{draft.length}/2000</span>
        </div>
      </form>

      <div className="mx-auto mt-3 flex max-w-3xl items-center justify-center gap-1.5 text-[10px] text-[#8E8EA0]">
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
        Changes confirmed through Blade AI refresh the workspace data.
      </div>
    </section>
  );
};
