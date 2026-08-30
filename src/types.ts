export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
  stats?: {
    docCount: number;
    convCount: number;
    indexedChunksCount: number;
  };
}

export type DocumentStatus = 'Uploading' | 'Processing' | 'Indexed' | 'Failed';

export interface DocumentItem {
  _id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: DocumentStatus;
  chunkCount: number;
  extractedTextPreview?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunkPreview {
  _id: string;
  chunkIndex: number;
  pageNumber?: number;
  tokenCount: number;
  textPreview: string;
}

export interface SourceCitation {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  snippet: string;
  score: number;
}

export interface MessageItem {
  _id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  createdAt: string;
}

export interface ConversationItem {
  _id: string;
  userId: string;
  title: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 'dashboard' | 'chat' | 'documents' | 'settings';
