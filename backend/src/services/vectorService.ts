import { DocumentChunk } from '../models/types';
import { db } from '../models/db';

export interface ScoredChunk {
  chunk: DocumentChunk;
  score: number;
}

export class VectorService {
  /**
   * Computes Cosine Similarity between two vectors
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
      return 0;
    }

    const minLen = Math.min(vecA.length, vecB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < minLen; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Performs vector similarity search with user-isolation & optional document filtering
   */
  public searchSimilarChunks(
    queryEmbedding: number[],
    userId: string,
    topK = 5,
    documentIdFilter?: string,
    minScoreThreshold = 0.15
  ): ScoredChunk[] {
    const userChunks = db.findChunksByUserId(userId);
    if (!userChunks || userChunks.length === 0) {
      return [];
    }

    const scoredList: ScoredChunk[] = [];

    for (const chunk of userChunks) {
      if (documentIdFilter && chunk.documentId !== documentIdFilter) {
        continue;
      }

      if (!chunk.embedding || chunk.embedding.length === 0) {
        continue;
      }

      const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= minScoreThreshold) {
        scoredList.push({ chunk, score });
      }
    }

    // Sort descending by similarity score
    scoredList.sort((a, b) => b.score - a.score);

    return scoredList.slice(0, topK);
  }
}

export const vectorService = new VectorService();
