export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'Uploading' | 'Processing' | 'Indexed' | 'Failed';

export interface Document {
  _id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string; // 'pdf' | 'docx' | 'txt'
  fileSize: number;
  status: DocumentStatus;
  chunkCount: number;
  extractedTextPreview?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  _id: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  pageNumber?: number;
  text: string;
  tokenCount: number;
  embedding: number[];
  metadata: {
    filename: string;
    fileType: string;
    uploadedAt: string;
  };
}

export interface SourceCitation {
  documentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  snippet: string;
  score: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: SourceCitation[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  token: string;
}
