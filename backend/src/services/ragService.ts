import { db } from '../models/db';
import { documentService } from './documentService';
import { embeddingService } from './embeddingService';
import { vectorService } from './vectorService';
import { llmService } from './llmService';
import { Document, SourceCitation } from '../models/types';

export interface RAGQueryResult {
  answer: string;
  sources: SourceCitation[];
  retrievedChunksCount: number;
}

export class RAGService {
  /**
   * Processes an uploaded document through the complete RAG indexing pipeline
   */
  public async processAndIndexDocument(
    documentId: string,
    userId: string,
    fileBuffer: Buffer,
    filename: string,
    fileType: string
  ): Promise<Document> {
    try {
      // Step 1: Update status to Processing
      db.updateDocument(documentId, { status: 'Processing' });

      // Step 2: Text Extraction
      const extraction = await documentService.extractText(fileBuffer, fileType, filename);
      const rawText = extraction.text;

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('No readable text could be extracted from this document.');
      }

      // Step 3: Text Cleaning
      const cleanedText = documentService.cleanText(rawText);

      // Step 4: Chunking
      let textChunks = documentService.chunkText(cleanedText, 900, 180, extraction.pageCount || 1);

      if (textChunks.length === 0) {
        if (cleanedText && cleanedText.trim().length > 0) {
          textChunks = [
            {
              chunkIndex: 0,
              text: cleanedText.trim(),
              pageNumber: 1,
              tokenCount: Math.ceil(cleanedText.length / 4),
            },
          ];
        } else {
          throw new Error('Document contained insufficient text for indexing.');
        }
      }

      // Clear any prior chunks for this document before adding new ones
      db.deleteChunksByDocumentId(documentId);

      // Step 5: Embeddings Generation
      const chunkTexts = textChunks.map(c => c.text);
      const embeddings = await embeddingService.generateBatchEmbeddings(chunkTexts);

      // Step 6: Store Chunks in Vector Store / Database
      const chunkObjects = textChunks.map((chunk, idx) => ({
        documentId,
        userId,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        embedding: embeddings[idx],
        metadata: {
          filename,
          fileType,
          uploadedAt: new Date().toISOString(),
        },
      }));

      db.addChunks(chunkObjects);

      // Step 7: Mark Document as Indexed
      const updatedDoc = db.updateDocument(documentId, {
        status: 'Indexed',
        chunkCount: chunkObjects.length,
        extractedTextPreview: cleanedText.slice(0, 300) + '...',
      });

      return updatedDoc!;
    } catch (err: any) {
      console.error(`Document processing failed for ${documentId}:`, err);
      const updatedDoc = db.updateDocument(documentId, {
        status: 'Failed',
        error: err.message || 'Processing failed',
      });
      return updatedDoc!;
    }
  }

  /**
   * Queries the RAG pipeline with a user question
   */
  public async query(
    question: string,
    userId: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
    documentIdFilter?: string
  ): Promise<RAGQueryResult> {
    const userDocs = db.findDocumentsByUserId(userId);
    const indexedDocs = userDocs.filter(d => d.status === 'Indexed');

    if (indexedDocs.length === 0) {
      return {
        answer: 'You have not uploaded any indexed college documents yet. Please navigate to the **Documents** section to upload college files (e.g. Academic Calendar, Hostel Rules, Examination Handbook, Placement Policy) so I can answer your questions accurately.',
        sources: [],
        retrievedChunksCount: 0,
      };
    }

    // Step 1: Query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(question);

    // Step 2: Vector database similarity search (with strict user isolation)
    const scoredChunks = vectorService.searchSimilarChunks(
      queryEmbedding,
      userId,
      4, // Top 4 most relevant chunks
      documentIdFilter,
      0.12 // Minimum similarity threshold
    );

    if (scoredChunks.length === 0) {
      return {
        answer: "I couldn't find this information in your uploaded college documents. Please make sure the relevant document is uploaded, or try asking in different words.",
        sources: [],
        retrievedChunksCount: 0,
      };
    }

    // Step 3: Build Context & Source Citations
    const contextParts: string[] = [];
    const sources: SourceCitation[] = [];

    scoredChunks.forEach((item, idx) => {
      const c = item.chunk;
      const doc = db.findDocumentById(c.documentId, userId);
      const docName = doc?.originalName || doc?.filename || c.metadata?.filename || 'Document';

      contextParts.push(
        `[Source #${idx + 1} | Document: "${docName}" | Page: ${c.pageNumber || 1} | Chunk: ${c.chunkIndex}]\n${c.text}`
      );

      // Create high-clarity source citation
      sources.push({
        documentId: c.documentId,
        filename: docName,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber || 1,
        snippet: c.text.length > 250 ? c.text.slice(0, 250) + '...' : c.text,
        score: Math.round(item.score * 100) / 100,
      });
    });

    const fullContext = contextParts.join('\n\n---\n\n');

    // Step 4: Call LLM with grounded prompt
    const llmResult = await llmService.generateAnswer(question, fullContext, chatHistory);

    return {
      answer: llmResult.answer,
      sources,
      retrievedChunksCount: scoredChunks.length,
    };
  }
}

export const ragService = new RAGService();
