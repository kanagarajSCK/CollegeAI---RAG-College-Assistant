import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Document, DocumentChunk, Conversation, Message } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');
const CHUNKS_FILE = path.join(DATA_DIR, 'chunks.json');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const tempPath = `${filePath}.tmp.${crypto.randomBytes(4).toString('hex')}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
  }
}

class DatabaseStore {
  private users: Map<string, User> = new Map();
  private documents: Map<string, Document> = new Map();
  private chunks: Map<string, DocumentChunk> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message> = new Map();

  constructor() {
    this.loadAll();
  }

  private loadAll() {
    const usersList = readJsonFile<User[]>(USERS_FILE, []);
    usersList.forEach(u => this.users.set(u._id, u));

    const docsList = readJsonFile<Document[]>(DOCUMENTS_FILE, []);
    docsList.forEach(d => this.documents.set(d._id, d));

    const chunksList = readJsonFile<DocumentChunk[]>(CHUNKS_FILE, []);
    chunksList.forEach(c => this.chunks.set(c._id, c));

    const convsList = readJsonFile<Conversation[]>(CONVERSATIONS_FILE, []);
    convsList.forEach(c => this.conversations.set(c._id, c));

    const msgsList = readJsonFile<Message[]>(MESSAGES_FILE, []);
    msgsList.forEach(m => this.messages.set(m._id, m));
  }

  public saveUsers() {
    writeJsonFile(USERS_FILE, Array.from(this.users.values()));
  }

  public saveDocuments() {
    writeJsonFile(DOCUMENTS_FILE, Array.from(this.documents.values()));
  }

  public saveChunks() {
    writeJsonFile(CHUNKS_FILE, Array.from(this.chunks.values()));
  }

  public saveConversations() {
    writeJsonFile(CONVERSATIONS_FILE, Array.from(this.conversations.values()));
  }

  public saveMessages() {
    writeJsonFile(MESSAGES_FILE, Array.from(this.messages.values()));
  }

  // --- User Operations ---
  public findUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public findUserByEmail(email: string): User | undefined {
    const normEmail = email.toLowerCase().trim();
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === normEmail);
  }

  public createUser(user: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): User {
    const id = 'usr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newUser: User = {
      _id: id,
      ...user,
      email: user.email.toLowerCase().trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    this.saveUsers();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);
    this.saveUsers();
    return updated;
  }

  public deleteUser(id: string): boolean {
    const deleted = this.users.delete(id);
    if (deleted) {
      this.saveUsers();
      // Also cleanup user documents, chunks, conversations, messages
      const userDocs = this.findDocumentsByUserId(id);
      userDocs.forEach(d => this.deleteDocument(d._id, id));

      const userConvs = this.findConversationsByUserId(id);
      userConvs.forEach(c => this.deleteConversation(c._id, id));
    }
    return deleted;
  }

  // --- Document Operations ---
  public createDocument(doc: Omit<Document, '_id' | 'createdAt' | 'updatedAt'>): Document {
    const id = 'doc_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newDoc: Document = {
      _id: id,
      ...doc,
      createdAt: now,
      updatedAt: now,
    };
    this.documents.set(id, newDoc);
    this.saveDocuments();
    return newDoc;
  }

  public findDocumentById(id: string, userId?: string): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    if (userId && doc.userId !== userId) return undefined;
    return doc;
  }

  public getAllDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  public findDocumentsByUserId(userId: string): Document[] {
    return Array.from(this.documents.values())
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateDocument(id: string, updates: Partial<Document>): Document | undefined {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, ...updates, updatedAt: new Date().toISOString() };
    this.documents.set(id, updated);
    this.saveDocuments();
    return updated;
  }

  public deleteDocument(id: string, userId: string): boolean {
    const doc = this.documents.get(id);
    if (!doc || doc.userId !== userId) return false;

    this.documents.delete(id);
    this.saveDocuments();

    // Delete chunks associated with this document
    let chunksDeleted = false;
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.documentId === id) {
        this.chunks.delete(chunkId);
        chunksDeleted = true;
      }
    }
    if (chunksDeleted) {
      this.saveChunks();
    }
    return true;
  }

  // --- Chunk Operations ---
  public addChunks(chunks: Omit<DocumentChunk, '_id'>[]): DocumentChunk[] {
    const added: DocumentChunk[] = [];
    chunks.forEach(c => {
      const id = 'chk_' + crypto.randomBytes(8).toString('hex');
      const chunkObj: DocumentChunk = {
        _id: id,
        ...c,
      };
      this.chunks.set(id, chunkObj);
      added.push(chunkObj);
    });
    this.saveChunks();
    return added;
  }

  public findChunksByUserId(userId: string): DocumentChunk[] {
    return Array.from(this.chunks.values()).filter(c => c.userId === userId);
  }

  public findChunksByDocumentId(documentId: string): DocumentChunk[] {
    return Array.from(this.chunks.values()).filter(c => c.documentId === documentId);
  }

  public deleteChunksByDocumentId(documentId: string): boolean {
    let chunksDeleted = false;
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(chunkId);
        chunksDeleted = true;
      }
    }
    if (chunksDeleted) {
      this.saveChunks();
    }
    return chunksDeleted;
  }

  // --- Conversation Operations ---
  public createConversation(userId: string, title: string = 'New Conversation'): Conversation {
    const id = 'conv_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const conv: Conversation = {
      _id: id,
      userId,
      title,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(id, conv);
    this.saveConversations();
    return conv;
  }

  public findConversationById(id: string, userId: string): Conversation | undefined {
    const conv = this.conversations.get(id);
    if (!conv || conv.userId !== userId) return undefined;
    return conv;
  }

  public findConversationsByUserId(userId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public updateConversation(id: string, userId: string, updates: Partial<Conversation>): Conversation | undefined {
    const conv = this.findConversationById(id, userId);
    if (!conv) return undefined;
    const updated = { ...conv, ...updates, updatedAt: new Date().toISOString() };
    this.conversations.set(id, updated);
    this.saveConversations();
    return updated;
  }

  public deleteConversation(id: string, userId: string): boolean {
    const conv = this.findConversationById(id, userId);
    if (!conv) return false;

    this.conversations.delete(id);
    this.saveConversations();

    // Delete messages for this conversation
    let msgsDeleted = false;
    for (const [msgId, msg] of this.messages.entries()) {
      if (msg.conversationId === id) {
        this.messages.delete(msgId);
        msgsDeleted = true;
      }
    }
    if (msgsDeleted) {
      this.saveMessages();
    }
    return true;
  }

  // --- Message Operations ---
  public createMessage(msg: Omit<Message, '_id' | 'createdAt'>): Message {
    const id = 'msg_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    const newMsg: Message = {
      _id: id,
      ...msg,
      createdAt: now,
    };
    this.messages.set(id, newMsg);
    this.saveMessages();

    // Update conversation updatedAt and lastMessagePreview
    const conv = this.conversations.get(msg.conversationId);
    if (conv) {
      conv.updatedAt = now;
      conv.lastMessagePreview = msg.content.slice(0, 80);
      this.saveConversations();
    }

    return newMsg;
  }

  public findMessagesByConversationId(conversationId: string, userId: string): Message[] {
    return Array.from(this.messages.values())
      .filter(m => m.conversationId === conversationId && m.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public clearMessagesForConversation(conversationId: string, userId: string): boolean {
    let deletedCount = 0;
    for (const [msgId, msg] of this.messages.entries()) {
      if (msg.conversationId === conversationId && msg.userId === userId) {
        this.messages.delete(msgId);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.saveMessages();
      const conv = this.conversations.get(conversationId);
      if (conv) {
        conv.lastMessagePreview = undefined;
        conv.updatedAt = new Date().toISOString();
        this.saveConversations();
      }
    }
    return true;
  }

  // Stats query
  public getUserStats(userId: string) {
    const docCount = Array.from(this.documents.values()).filter(d => d.userId === userId).length;
    const convCount = Array.from(this.conversations.values()).filter(c => c.userId === userId).length;
    const indexedChunksCount = Array.from(this.chunks.values()).filter(c => c.userId === userId).length;
    return { docCount, convCount, indexedChunksCount };
  }
}

export const db = new DatabaseStore();
