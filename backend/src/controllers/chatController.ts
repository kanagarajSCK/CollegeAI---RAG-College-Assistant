import { Response } from 'express';
import { db } from '../models/db';
import { ragService } from '../services/ragService';
import { AuthRequest } from '../middleware/auth';

export class ChatController {
  public async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { message, conversationId, documentIdFilter } = req.body;
      const userId = req.user!.id;

      if (!message || message.trim().length === 0) {
        res.status(400).json({ error: 'Message cannot be empty.' });
        return;
      }

      let convId = conversationId;
      let conversation = convId ? db.findConversationById(convId, userId) : undefined;

      if (!conversation) {
        // Create new conversation with auto-generated title
        const cleanTitle = message.trim().slice(0, 45).replace(/[^\w\s-]/g, '');
        const title = cleanTitle ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1) : 'College Inquiry';
        conversation = db.createConversation(userId, title);
        convId = conversation._id;
      }

      // 1. Save user message
      const userMsg = db.createMessage({
        conversationId: convId,
        userId,
        role: 'user',
        content: message.trim(),
      });

      // 2. Fetch recent conversation history for contextual grounding
      const historyMessages = db.findMessagesByConversationId(convId, userId);
      const formattedHistory = historyMessages.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // 3. Execute full RAG pipeline
      const ragResult = await ragService.query(message.trim(), userId, formattedHistory, documentIdFilter);

      // 4. Save assistant response with source citations
      const assistantMsg = db.createMessage({
        conversationId: convId,
        userId,
        role: 'assistant',
        content: ragResult.answer,
        sources: ragResult.sources,
      });

      res.json({
        conversationId: convId,
        conversation,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        sources: ragResult.sources,
        retrievedChunksCount: ragResult.retrievedChunksCount,
      });
    } catch (err: any) {
      console.error('Send message error:', err);
      res.status(500).json({ error: 'Failed to process chat query: ' + (err.message || 'Unknown error') });
    }
  }

  public async getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversations = db.findConversationsByUserId(userId);
      res.json({ conversations });
    } catch (err: any) {
      console.error('Get conversations error:', err);
      res.status(500).json({ error: 'Failed to fetch conversations.' });
    }
  }

  public async getConversationById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const conversation = db.findConversationById(id, userId);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }

      const messages = db.findMessagesByConversationId(id, userId);

      res.json({
        conversation,
        messages,
      });
    } catch (err: any) {
      console.error('Get conversation details error:', err);
      res.status(500).json({ error: 'Failed to fetch conversation messages.' });
    }
  }

  public async updateConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const userId = req.user!.id;

      if (!title || title.trim().length === 0) {
        res.status(400).json({ error: 'Title cannot be empty.' });
        return;
      }

      const updated = db.updateConversation(id, userId, { title: title.trim() });
      if (!updated) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }

      res.json({ conversation: updated });
    } catch (err: any) {
      console.error('Update conversation error:', err);
      res.status(500).json({ error: 'Failed to update conversation.' });
    }
  }

  public async deleteConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const success = db.deleteConversation(id, userId);
      if (!success) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }

      res.json({ message: 'Conversation deleted successfully.' });
    } catch (err: any) {
      console.error('Delete conversation error:', err);
      res.status(500).json({ error: 'Failed to delete conversation.' });
    }
  }

  public async clearConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const conv = db.findConversationById(id, userId);
      if (!conv) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }

      db.clearMessagesForConversation(id, userId);

      res.json({ message: 'Conversation messages cleared.' });
    } catch (err: any) {
      console.error('Clear conversation error:', err);
      res.status(500).json({ error: 'Failed to clear conversation messages.' });
    }
  }

  public async regenerateResponse(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { conversationId, documentIdFilter } = req.body;
      const userId = req.user!.id;

      const conv = db.findConversationById(conversationId, userId);
      if (!conv) {
        res.status(404).json({ error: 'Conversation not found.' });
        return;
      }

      const messages = db.findMessagesByConversationId(conversationId, userId);
      if (messages.length === 0) {
        res.status(400).json({ error: 'No messages to regenerate.' });
        return;
      }

      // Find the last user message
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (!lastUserMsg) {
        res.status(400).json({ error: 'No user query found in conversation.' });
        return;
      }

      const history = messages
        .filter(m => m._id !== lastUserMsg._id)
        .slice(-6)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const ragResult = await ragService.query(lastUserMsg.content, userId, history, documentIdFilter);

      const assistantMsg = db.createMessage({
        conversationId,
        userId,
        role: 'assistant',
        content: ragResult.answer,
        sources: ragResult.sources,
      });

      res.json({
        assistantMessage: assistantMsg,
        sources: ragResult.sources,
      });
    } catch (err: any) {
      console.error('Regenerate response error:', err);
      res.status(500).json({ error: 'Failed to regenerate answer.' });
    }
  }
}

export const chatController = new ChatController();
