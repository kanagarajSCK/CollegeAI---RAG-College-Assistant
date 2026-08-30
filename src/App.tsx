import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { ActiveTab, DocumentItem, ConversationItem, MessageItem } from './types';
import { Loader2 } from 'lucide-react';

export function App() {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data states
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);

  // Fetch initial documents and conversations when logged in
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingDocuments(true);
      try {
        const [docsRes, convsRes] = await Promise.all([
          api.getDocuments(),
          api.getConversations(),
        ]);
        setDocuments(docsRes.documents || []);
        setConversations(convsRes.conversations || []);
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadData();
  }, [user]);

  // Load messages when current conversation changes
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await api.getConversationById(currentConversationId);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load conversation messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentConversationId]);

  // Continuously poll documents whenever any document is in 'Processing' state
  useEffect(() => {
    if (!user) return;
    const isAnyProcessing = documents.some(d => d.status === 'Processing');
    if (!isAnyProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getDocuments();
        if (res.documents) {
          setDocuments(res.documents);
        }
      } catch (err) {
        console.error('Error polling documents status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [documents, user]);

  // Actions
  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    setActiveTab('chat');
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setActiveTab('chat');
  };

  const handleSendMessage = async (text: string, documentIdFilter?: string) => {
    setSendingMessage(true);

    // Optimistically add user message to UI
    const tempUserMsg: MessageItem = {
      _id: 'temp-' + Date.now(),
      conversationId: currentConversationId || 'new',
      userId: user!.id,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.sendMessage(text, currentConversationId || undefined, documentIdFilter);

      // Update current conversation
      setCurrentConversationId(res.conversationId);

      // Replace optimistic message with confirmed messages
      setMessages(prev => [
        ...prev.filter(m => m._id !== tempUserMsg._id),
        res.userMessage,
        res.assistantMessage,
      ]);

      // Update conversations list
      setConversations(prev => {
        const exists = prev.find(c => c._id === res.conversationId);
        if (exists) {
          return prev.map(c =>
            c._id === res.conversationId
              ? { ...c, lastMessagePreview: res.assistantMessage.content.slice(0, 60), updatedAt: new Date().toISOString() }
              : c
          );
        } else {
          return [res.conversation, ...prev];
        }
      });
    } catch (err: any) {
      alert(err.message || 'Failed to generate response. Please try again.');
      // Remove failed optimistic message
      setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRegenerate = async (documentIdFilter?: string) => {
    if (!currentConversationId || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await api.regenerateResponse(currentConversationId, documentIdFilter);
      setMessages(prev => [...prev, res.assistantMessage]);
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate response.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await api.updateConversation(id, newTitle);
      setConversations(prev => prev.map(c => (c._id === id ? res.conversation : c)));
    } catch (err: any) {
      alert(err.message || 'Failed to rename conversation.');
    }
  };

  const handleDeleteConversation = async (id?: string) => {
    const targetId = id || currentConversationId;
    if (!targetId) return;

    try {
      await api.deleteConversation(targetId);
      setConversations(prev => prev.filter(c => c._id !== targetId));
      if (currentConversationId === targetId) {
        handleNewChat();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete conversation.');
    }
  };

  const handleClearConversation = async () => {
    if (!currentConversationId) return;

    try {
      await api.clearConversation(currentConversationId);
      setMessages([]);
    } catch (err: any) {
      console.error('Failed to clear conversation messages:', err);
    }
  };

  const handleUploadDocument = async (file: File) => {
    try {
      const res = await api.uploadDocument(file);
      setDocuments(prev => [res.document, ...prev.filter(d => d._id !== res.document._id)]);
    } catch (err: any) {
      throw err;
    }
  };

  const handleReindexDocument = async (id: string) => {
    try {
      await api.reindexDocument(id);
      setDocuments(prev =>
        prev.map(d => (d._id === id ? { ...d, status: 'Processing' as const, error: undefined } : d))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to reindex document.');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete document.');
    }
  };

  const handleLoadSamples = async () => {
    setLoadingSamples(true);
    try {
      const res = await api.loadSampleDocuments();
      setDocuments(res.documents || []);
    } catch (err: any) {
      alert(err.message || 'Failed to load sample documents: ' + err.message);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleRefreshDocs = async () => {
    setLoadingDocuments(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (err: any) {
      console.error('Failed to refresh documents:', err);
    } finally {
      setLoadingDocuments(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-600">Initializing CollegeAI Portal...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (authView === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    } else {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

  const currentConv = conversations.find(c => c._id === currentConversationId) || null;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar
          activeTab={activeTab}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'dashboard' && (
            <DashboardPage
              documents={documents}
              conversations={conversations}
              setActiveTab={setActiveTab}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onLoadSamples={handleLoadSamples}
              loadingSamples={loadingSamples}
            />
          )}

          {activeTab === 'chat' && (
            <ChatPage
              currentConversation={currentConv}
              messages={messages}
              documents={documents}
              loadingMessages={loadingMessages}
              sendingMessage={sendingMessage}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerate}
              onClearConversation={handleClearConversation}
              onDeleteConversation={() => handleDeleteConversation()}
              onRenameConversation={async newTitle => {
                if (currentConversationId) {
                  await handleRenameConversation(currentConversationId, newTitle);
                }
              }}
              onNewChat={handleNewChat}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage
              documents={documents}
              loadingDocuments={loadingDocuments}
              onUpload={handleUploadDocument}
              onDelete={handleDeleteDocument}
              onReindex={handleReindexDocument}
              onLoadSamples={handleLoadSamples}
              loadingSamples={loadingSamples}
              onRefresh={handleRefreshDocs}
            />
          )}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
