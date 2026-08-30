import { Response } from 'express';
import { db } from '../models/db';
import { ragService } from '../services/ragService';
import { AuthRequest } from '../middleware/auth';
import { SAMPLE_COLLEGE_DOCS } from '../data/sampleDocuments';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class DocumentController {
  public async uploadDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const file = req.file;
      const userId = req.user!.id;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded. Please choose a PDF, DOCX, or TXT document.' });
        return;
      }

      const originalName = file.originalname;
      const ext = path.extname(originalName).toLowerCase().replace('.', '') || 'txt';
      const fileSize = file.size;

      // Create document entry in database
      const newDoc = db.createDocument({
        userId,
        filename: originalName,
        originalName,
        fileType: ext,
        fileSize,
        status: 'Processing',
        chunkCount: 0,
      });

      // Save file to disk in uploads directory for persistence and retry
      const diskFilename = `${newDoc._id}_${path.basename(originalName)}`;
      const diskPath = path.join(UPLOAD_DIR, diskFilename);
      try {
        fs.writeFileSync(diskPath, file.buffer);
      } catch (saveErr) {
        console.warn('Failed to save file to disk:', saveErr);
      }

      // Process and index document
      // For responsiveness, process asynchronously while returning 201
      ragService
        .processAndIndexDocument(newDoc._id, userId, file.buffer, originalName, ext)
        .then(indexedDoc => {
          console.log(`Document ${indexedDoc._id} successfully indexed with ${indexedDoc.chunkCount} chunks.`);
        })
        .catch(err => {
          console.error(`Error processing document ${newDoc._id}:`, err);
        });

      res.status(201).json({
        message: 'File uploaded and indexing initiated.',
        document: newDoc,
      });
    } catch (err: any) {
      console.error('Upload document error:', err);
      res.status(500).json({ error: 'Failed to upload document: ' + (err.message || 'Unknown error') });
    }
  }

  public async reindexDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const doc = db.findDocumentById(id, userId);
      if (!doc) {
        res.status(404).json({ error: 'Document not found or access denied.' });
        return;
      }

      // Find file on disk
      const files = fs.readdirSync(UPLOAD_DIR);
      const matchedFile = files.find(f => f.startsWith(`${id}_`));

      if (matchedFile) {
        const filePath = path.join(UPLOAD_DIR, matchedFile);
        const fileBuffer = fs.readFileSync(filePath);
        const ext = doc.fileType || path.extname(doc.filename).replace('.', '') || 'txt';

        db.updateDocument(id, { status: 'Processing', error: undefined });

        ragService
          .processAndIndexDocument(id, userId, fileBuffer, doc.originalName || doc.filename, ext)
          .then(indexedDoc => {
            console.log(`Re-indexing completed for ${indexedDoc._id}: ${indexedDoc.chunkCount} chunks.`);
          })
          .catch(err => {
            console.error(`Re-indexing failed for ${id}:`, err);
          });

        res.json({ message: 'Re-indexing initiated.', document: db.findDocumentById(id, userId) });
        return;
      }

      // If this is a sample document, find in sample data
      const sample = SAMPLE_COLLEGE_DOCS.find(s => s.filename === doc.filename);
      if (sample) {
        const buffer = Buffer.from(sample.content, 'utf-8');
        db.updateDocument(id, { status: 'Processing', error: undefined });

        ragService
          .processAndIndexDocument(id, userId, buffer, sample.originalName, 'txt')
          .then(indexedDoc => {
            console.log(`Re-indexing sample completed for ${indexedDoc._id}`);
          })
          .catch(err => {
            console.error(`Re-indexing sample failed for ${id}:`, err);
          });

        res.json({ message: 'Re-indexing initiated.', document: db.findDocumentById(id, userId) });
        return;
      }

      res.status(400).json({
        error: 'Original file buffer not available. Please delete and re-upload the document.',
      });
    } catch (err: any) {
      console.error('Reindex document error:', err);
      res.status(500).json({ error: 'Failed to reindex document: ' + (err.message || 'Unknown error') });
    }
  }

  public async listDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const documents = db.findDocumentsByUserId(userId);
      res.json({ documents });
    } catch (err: any) {
      console.error('List documents error:', err);
      res.status(500).json({ error: 'Failed to retrieve documents.' });
    }
  }

  public async getDocumentById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const doc = db.findDocumentById(id, userId);
      if (!doc) {
        res.status(404).json({ error: 'Document not found or access denied.' });
        return;
      }

      const chunks = db.findChunksByDocumentId(id);

      res.json({
        document: doc,
        chunksCount: chunks.length,
        chunks: chunks.map(c => ({
          _id: c._id,
          chunkIndex: c.chunkIndex,
          pageNumber: c.pageNumber,
          tokenCount: c.tokenCount,
          textPreview: c.text.slice(0, 150) + '...',
        })),
      });
    } catch (err: any) {
      console.error('Get document error:', err);
      res.status(500).json({ error: 'Failed to fetch document details.' });
    }
  }

  public async deleteDocument(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const success = db.deleteDocument(id, userId);
      if (!success) {
        res.status(404).json({ error: 'Document not found or access denied.' });
        return;
      }

      // Cleanup disk file if exists
      try {
        const files = fs.readdirSync(UPLOAD_DIR);
        const matchedFile = files.find(f => f.startsWith(`${id}_`));
        if (matchedFile) {
          fs.unlinkSync(path.join(UPLOAD_DIR, matchedFile));
        }
      } catch (cleanErr) {
        console.warn('Failed to delete file from disk:', cleanErr);
      }

      res.json({ message: 'Document and its vector index deleted successfully.' });
    } catch (err: any) {
      console.error('Delete document error:', err);
      res.status(500).json({ error: 'Failed to delete document.' });
    }
  }

  public async loadSampleDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const createdDocs = [];

      for (const sample of SAMPLE_COLLEGE_DOCS) {
        // Check if sample already exists for user
        const existing = db.findDocumentsByUserId(userId).find(d => d.filename === sample.filename);
        if (existing) {
          // If existing is stuck in Processing or Failed, re-process it
          if (existing.status === 'Processing' || existing.status === 'Failed') {
            const buffer = Buffer.from(sample.content, 'utf-8');
            await ragService.processAndIndexDocument(existing._id, userId, buffer, sample.originalName, 'txt');
          }
          continue;
        }

        const buffer = Buffer.from(sample.content, 'utf-8');
        const doc = db.createDocument({
          userId,
          filename: sample.filename,
          originalName: sample.originalName,
          fileType: sample.fileType,
          fileSize: buffer.length,
          status: 'Processing',
          chunkCount: 0,
        });

        await ragService.processAndIndexDocument(doc._id, userId, buffer, sample.originalName, 'txt');
        createdDocs.push(db.findDocumentById(doc._id, userId));
      }

      const allDocs = db.findDocumentsByUserId(userId);
      res.json({
        message: 'Sample college documents loaded and indexed successfully.',
        documents: allDocs,
      });
    } catch (err: any) {
      console.error('Load sample documents error:', err);
      res.status(500).json({ error: 'Failed to load sample documents.' });
    }
  }
}

export const documentController = new DocumentController();
