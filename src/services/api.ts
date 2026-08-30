import { User, DocumentItem, ConversationItem, MessageItem, SourceCitation } from '../types';

// Support standalone frontend deployment connected to an external backend URL
const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '').trim();
const normalizedUrl = rawEnvUrl.replace(/\/+$/, '');
const API_BASE = normalizedUrl ? (normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`) : '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('collegeai_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    if (res.status === 401) {
      // Session expired
      localStorage.removeItem('collegeai_token');
      localStorage.removeItem('collegeai_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // --- Auth ---
  async register(name: string, email: string, password: string, confirmPassword?: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    return handleResponse<{ message: string; token: string; user: User }>(res);
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<{ message: string; token: string; user: User }>(res);
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  async updateProfile(name: string) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse<{ message: string; user: User }>(res);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<{ message: string }>(res);
  },

  async deleteAccount() {
    const res = await fetch(`${API_BASE}/auth/account`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // --- Documents ---
  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ documents: DocumentItem[] }>(res);
  },

  async getDocumentById(id: string) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<{
      document: DocumentItem;
      chunksCount: number;
      chunks: Array<{
        _id: string;
        chunkIndex: number;
        pageNumber?: number;
        tokenCount: number;
        textPreview: string;
      }>;
    }>(res);
  },

  async uploadDocument(file: File) {
    const token = localStorage.getItem('collegeai_token');
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<{ message: string; document: DocumentItem }>(res);
  },

  async loadSampleDocuments() {
    const res = await fetch(`${API_BASE}/documents/load-sample`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; documents: DocumentItem[] }>(res);
  },

  async reindexDocument(id: string) {
    const res = await fetch(`${API_BASE}/documents/${id}/reindex`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string; document: DocumentItem }>(res);
  },

  async deleteDocument(id: string) {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // --- Chat & Conversations ---
  async getConversations() {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ conversations: ConversationItem[] }>(res);
  },

  async getConversationById(id: string) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ conversation: ConversationItem; messages: MessageItem[] }>(res);
  },

  async sendMessage(message: string, conversationId?: string, documentIdFilter?: string) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, conversationId, documentIdFilter }),
    });
    return handleResponse<{
      conversationId: string;
      conversation: ConversationItem;
      userMessage: MessageItem;
      assistantMessage: MessageItem;
      sources: SourceCitation[];
      retrievedChunksCount: number;
    }>(res);
  },

  async regenerateResponse(conversationId: string, documentIdFilter?: string) {
    const res = await fetch(`${API_BASE}/chat/regenerate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ conversationId, documentIdFilter }),
    });
    return handleResponse<{
      assistantMessage: MessageItem;
      sources: SourceCitation[];
    }>(res);
  },

  async updateConversation(id: string, title: string) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title }),
    });
    return handleResponse<{ conversation: ConversationItem }>(res);
  },

  async deleteConversation(id: string) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async clearConversation(id: string) {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}/clear`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },
};
