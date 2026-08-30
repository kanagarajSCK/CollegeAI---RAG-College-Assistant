import React, { useState } from 'react';
import {
  MessageSquarePlus,
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from './ConfirmModal';
import { ConversationItem, ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  conversations: ConversationItem[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (id: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [convToDelete, setConvToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by time
  const groupConversations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: ConversationItem[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: [],
    };

    filteredConversations.forEach(conv => {
      const convDate = new Date(conv.updatedAt || conv.createdAt);
      if (convDate >= today) {
        groups['Today'].push(conv);
      } else if (convDate >= yesterday) {
        groups['Yesterday'].push(conv);
      } else if (convDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groups['Previous 7 Days'].push(conv);
      } else {
        groups['Older'].push(conv);
      }
    });

    return groups;
  };

  const grouped = groupConversations();

  const handleStartRename = (conv: ConversationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConvToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!convToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteConversation(convToDelete);
      setConvToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900 leading-tight">CollegeAI</h1>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">RAG Assistant</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="px-4 pt-4 pb-2">
          <button
            id="btn-new-chat"
            onClick={() => {
              onNewChat();
              setActiveTab('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-xs shadow-indigo-100"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Main Menu */}
        <div className="px-3 py-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1.5">
            Main Menu
          </p>
          <div className="space-y-0.5">
            <button
              id="nav-dashboard"
              onClick={() => {
                setActiveTab('dashboard');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-chat"
              onClick={() => {
                setActiveTab('chat');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>Chat Assistant</span>
            </button>

            <button
              id="nav-documents"
              onClick={() => {
                setActiveTab('documents');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'documents'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'documents' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>Documents</span>
            </button>

            <button
              id="nav-settings"
              onClick={() => {
                setActiveTab('settings');
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-gray-100">
          <div className="px-5 pb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Recent Chats
            </p>
          </div>

          {/* Search bar */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Scrollable conversation list */}
          <nav className="flex-1 overflow-y-auto px-3 space-y-3 text-sm">
            {Object.entries(grouped).map(([groupTitle, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {groupTitle}
                  </div>
                  {items.map(conv => {
                    const isSelected = currentConversationId === conv._id && activeTab === 'chat';
                    const isEditing = editingId === conv._id;

                    return (
                      <div
                        key={conv._id}
                        onClick={() => {
                          onSelectConversation(conv._id);
                          setActiveTab('chat');
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              className="w-full text-xs px-1.5 py-1 bg-white border border-indigo-400 rounded text-gray-900 focus:outline-none"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename(conv._id, e as any);
                                if (e.key === 'Escape') handleCancelRename(e as any);
                              }}
                            />
                            <button
                              onClick={e => handleSaveRename(conv._id, e)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                              <span className="truncate text-xs">{conv.title}</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={e => handleStartRename(conv, e)}
                                title="Rename"
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-white rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={e => handleDelete(conv._id, e)}
                                title="Delete"
                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="text-center py-6 px-2 text-xs text-gray-400">
                {searchQuery ? 'No matching chats' : 'No previous conversations'}
              </div>
            )}
          </nav>
        </div>

        {/* User Profile & Logout Bottom Section */}
        <div className="p-3 border-t border-gray-100 bg-gray-50/70">
          <div className="flex items-center justify-between p-1">
            <div
              onClick={() => {
                setActiveTab('settings');
                if (window.innerWidth < 1024) onClose();
              }}
              className="flex items-center gap-2.5 cursor-pointer min-w-0 pr-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-medium text-xs flex items-center justify-center shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={logout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Delete Conversation Confirmation Modal */}
      <ConfirmModal
        isOpen={!!convToDelete}
        title="Delete Conversation?"
        message="Are you sure you want to delete this chat session? All message history for this conversation will be permanently removed."
        confirmText="Delete Chat"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConvToDelete(null)}
      />
    </>
  );
};

