import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Loader2,
  Filter,
  Trash2,
  Eraser,
  Edit2,
  Check,
  X,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ChatMessage } from '../components/ChatMessage';
import { SuggestedQuestions } from '../components/SuggestedQuestions';
import { SourceCitationModal } from '../components/SourceCitationModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { MessageItem, ConversationItem, DocumentItem, SourceCitation } from '../types';

interface ChatPageProps {
  currentConversation: ConversationItem | null;
  messages: MessageItem[];
  documents: DocumentItem[];
  loadingMessages: boolean;
  sendingMessage: boolean;
  onSendMessage: (text: string, documentIdFilter?: string) => Promise<void>;
  onRegenerate: (documentIdFilter?: string) => Promise<void>;
  onClearConversation: () => Promise<void>;
  onDeleteConversation: () => Promise<void>;
  onRenameConversation: (newTitle: string) => Promise<void>;
  onNewChat: () => void;
}

const QUICK_SUGGESTIONS = [
  'Hostel application last date?',
  'Exam fees & grading scheme',
  'Academic calendar & holidays',
  'Placement eligibility rules',
];

export const ChatPage: React.FC<ChatPageProps> = ({
  currentConversation,
  messages,
  documents,
  loadingMessages,
  sendingMessage,
  onSendMessage,
  onRegenerate,
  onClearConversation,
  onDeleteConversation,
  onRenameConversation,
  onNewChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [docFilter, setDocFilter] = useState<string>('all');
  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendingMessage]);

  useEffect(() => {
    if (currentConversation) {
      setTitleInput(currentConversation.title);
    }
  }, [currentConversation]);

  // Adjust textarea height
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sendingMessage) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const filterVal = docFilter === 'all' ? undefined : docFilter;
    await onSendMessage(text, filterVal);
  };

  const handleSaveTitle = async () => {
    if (titleInput.trim() && titleInput !== currentConversation?.title) {
      await onRenameConversation(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const indexedDocs = documents.filter(d => d.status === 'Indexed');

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] lg:h-screen bg-white">
      {/* Header */}
      <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 bg-white border-b border-gray-100 z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 w-full max-w-xs">
              <input
                type="text"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                className="text-xs sm:text-sm font-semibold px-2 py-1 bg-gray-50 border border-indigo-500 rounded-md text-gray-900 focus:outline-none w-full"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded shrink-0"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditingTitle(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-medium text-gray-800 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">
                {currentConversation?.title || 'College Information Inquiry'}
              </h2>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded shrink-0">
                RAG Active
              </span>
              {currentConversation && (
                <button
                  onClick={() => {
                    setIsEditingTitle(true);
                    setTitleInput(currentConversation.title);
                  }}
                  title="Rename Title"
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded transition-colors shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Document Scope Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-2 sm:left-2.5 pointer-events-none" />
            <select
              value={docFilter}
              onChange={e => setDocFilter(e.target.value)}
              className="pl-7 sm:pl-8 pr-6 sm:pr-7 py-1.5 text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none transition-colors max-w-[120px] sm:max-w-[180px] truncate"
            >
              <option value="all">All Docs ({indexedDocs.length})</option>
              {indexedDocs.map(d => (
                <option key={d._id} value={d._id}>
                  {d.originalName || d.filename}
                </option>
              ))}
            </select>
          </div>

          <span className="hidden md:inline text-xs text-gray-400">
            {indexedDocs.length} Docs
          </span>

          {currentConversation && messages.length > 0 && (
            <button
              id="btn-chat-clear-messages"
              onClick={() => setShowClearModal(true)}
              title="Clear all messages"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eraser className="w-4 h-4" />
            </button>
          )}

          {currentConversation && (
            <button
              id="btn-chat-delete-conversation"
              onClick={() => setShowDeleteModal(true)}
              title="Delete conversation"
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        {loadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-indigo-600" />
            <span className="text-xs">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <SuggestedQuestions
              onSelect={q => {
                setInputText(q);
                textareaRef.current?.focus();
              }}
            />
          </div>
        ) : (
          <div className="py-6 space-y-4">
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === 'assistant' &&
                idx === messages.length - 1;

              return (
                <ChatMessage
                  key={msg._id || idx}
                  message={msg}
                  onRegenerate={() => onRegenerate(docFilter === 'all' ? undefined : docFilter)}
                  onViewCitation={citation => setActiveCitation(citation)}
                  isLastAssistant={isLastAssistant}
                />
              );
            })}

            {/* RAG Thinking Indicator */}
            {sendingMessage && (
              <div className="py-2.5 px-4 sm:px-8">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex-shrink-0 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  </div>
                  <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none text-xs text-gray-600 flex items-center gap-2 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span>Retrieving document chunks & synthesizing grounded answer...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Zero Documents Notice Banner */}
      {indexedDocs.length === 0 && (
        <div className="px-3 sm:px-6 py-2.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No documents indexed yet. Upload documents to ground AI responses.</span>
          </div>
          <button
            onClick={() => onNewChat()}
            className="underline font-semibold hover:text-amber-900 text-xs"
          >
            Go to Documents
          </button>
        </div>
      )}

      {/* Bottom Controls Area */}
      <div className="p-3 sm:p-6 pt-0 bg-white shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Suggestions Pills */}
          <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 overflow-x-auto pb-1.5 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 touch-pan-x">
            {QUICK_SUGGESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(q);
                  textareaRef.current?.focus();
                }}
                className="text-xs py-1.5 px-3 border border-gray-200 rounded-full text-gray-600 hover:border-indigo-300 hover:text-indigo-600 bg-white active:bg-gray-50 transition-colors whitespace-nowrap shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="relative flex items-center">
            <textarea
              id="input-chat-query"
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask about college regulations, fees, dates..."
              className="w-full py-3 sm:py-3.5 pl-4 sm:pl-5 pr-12 sm:pr-14 bg-white border border-gray-200 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base sm:text-sm transition-all placeholder:text-gray-400 resize-none max-h-32 sm:max-h-40 leading-relaxed"
            />
            <button
              id="btn-send-message"
              type="button"
              disabled={!inputText.trim() || sendingMessage}
              onClick={handleSend}
              className="absolute right-2 sm:right-3 p-2 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Send Message"
            >
              {sendingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-[10px] text-center text-gray-400 mt-2 tracking-wide uppercase font-medium">
            AI grounded in campus documents.
          </p>
        </div>
      </div>

      {/* Source Citation Modal */}
      <SourceCitationModal
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

      {/* Clear Messages Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        title="Clear Messages?"
        message="Are you sure you want to clear all messages in this conversation? The conversation thread will remain open with a fresh history."
        confirmText="Clear Messages"
        cancelText="Cancel"
        isDestructive={false}
        loading={actionLoading}
        onConfirm={async () => {
          setActionLoading(true);
          try {
            await onClearConversation();
            setShowClearModal(false);
          } finally {
            setActionLoading(false);
          }
        }}
        onCancel={() => setShowClearModal(false)}
      />

      {/* Delete Chat Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Conversation?"
        message="Are you sure you want to permanently delete this chat session? This action cannot be undone."
        confirmText="Delete Chat"
        cancelText="Cancel"
        isDestructive={true}
        loading={actionLoading}
        onConfirm={async () => {
          setActionLoading(true);
          try {
            await onDeleteConversation();
            setShowDeleteModal(false);
          } finally {
            setActionLoading(false);
          }
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

