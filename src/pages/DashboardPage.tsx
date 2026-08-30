import React from 'react';
import {
  FileText,
  MessageSquare,
  Sparkles,
  Upload,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DocumentItem, ConversationItem, ActiveTab } from '../types';

interface DashboardPageProps {
  documents: DocumentItem[];
  conversations: ConversationItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onLoadSamples: () => Promise<void>;
  loadingSamples: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  documents,
  conversations,
  setActiveTab,
  onSelectConversation,
  onNewChat,
  onLoadSamples,
  loadingSamples,
}) => {
  const { user } = useAuth();

  const indexedDocs = documents.filter(d => d.status === 'Indexed');
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0);

  return (
    <div className="p-3.5 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Query your college circulars, syllabus, hostel rules, and examination regulations with verified source citations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-dash-upload"
            onClick={() => setActiveTab('documents')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 rounded-xl sm:rounded-lg shadow-2xs transition-colors min-h-[40px]"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Upload Document</span>
          </button>

          <button
            id="btn-dash-ask"
            onClick={() => {
              onNewChat();
              setActiveTab('chat');
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl sm:rounded-lg shadow-xs shadow-indigo-100 transition-colors min-h-[40px]"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Ask College AI</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl sm:rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Knowledge Base</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{documents.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">{indexedDocs.length} Indexed</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl sm:rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Total Conversations</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{conversations.length}</span>
            <span className="text-xs text-gray-400 font-normal">Active Threads</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl sm:rounded-xl shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Vector Embeddings</span>
            <div className="p-1.5 bg-gray-100 text-gray-700 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{totalChunks}</span>
            <span className="text-xs text-gray-500 font-normal">Chunks in Vector DB</span>
          </div>
        </div>
      </div>

      {/* Quick Setup Notice if zero documents */}
      {documents.length === 0 && (
        <div className="p-4 sm:p-6 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3 className="text-sm font-semibold text-indigo-950">Get Started with Pre-Packaged College Documents</h3>
            </div>
            <p className="text-xs text-indigo-800 max-w-xl leading-relaxed">
              Load our sample pack containing the Academic Calendar, Hostel Guidelines, Placement Regulations, and Examination Rules to test RAG immediately.
            </p>
          </div>

          <button
            onClick={onLoadSamples}
            disabled={loadingSamples}
            className="w-full sm:w-auto shrink-0 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl sm:rounded-lg shadow-xs shadow-indigo-100 transition-colors disabled:opacity-60 text-center"
          >
            {loadingSamples ? 'Indexing Sample Files...' : 'Load Sample Documents'}
          </button>
        </div>
      )}

      {/* Grid: Recent Documents & Recent Conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Documents */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-900">Recently Uploaded</h2>
            </div>
            <button
              onClick={() => setActiveTab('documents')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {documents.slice(0, 4).map(doc => (
              <div
                key={doc._id}
                onClick={() => setActiveTab('documents')}
                className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100/80 active:bg-gray-100 rounded-xl transition-colors cursor-pointer gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-[10px]">
                    {doc.fileType.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-900 truncate">
                      {doc.originalName || doc.filename}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-gray-500">
                      {(doc.fileSize / 1024).toFixed(1)} KB • {doc.chunkCount || 0} chunks
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {doc.status === 'Indexed' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      Indexed
                    </span>
                  ) : doc.status === 'Processing' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3 animate-spin shrink-0" />
                      Processing
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}

            {documents.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400 space-y-2">
                <FileText className="w-7 h-7 mx-auto text-gray-300" />
                <p>No documents uploaded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Inquiries</h2>
            </div>
            <button
              onClick={() => {
                onNewChat();
                setActiveTab('chat');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <span>+ New Chat</span>
            </button>
          </div>

          <div className="space-y-2">
            {conversations.slice(0, 4).map(conv => (
              <div
                key={conv._id}
                onClick={() => {
                  onSelectConversation(conv._id);
                  setActiveTab('chat');
                }}
                className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 hover:bg-indigo-50/50 active:bg-indigo-50 rounded-xl transition-colors cursor-pointer group gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-900 group-hover:text-indigo-900 truncate">
                    {conv.title}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-gray-500 truncate mt-0.5">
                    {conv.lastMessagePreview || 'No messages yet'}
                  </div>
                </div>

                <span className="text-[10px] sm:text-[11px] text-gray-400 shrink-0">
                  {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400 space-y-2">
                <MessageSquare className="w-7 h-7 mx-auto text-gray-300" />
                <p>No conversations started yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

