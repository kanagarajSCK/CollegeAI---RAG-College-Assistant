import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  text: string;
  pages?: ExtractedPage[];
  pageCount?: number;
}

export interface TextChunk {
  chunkIndex: number;
  text: string;
  pageNumber?: number;
  tokenCount: number;
}

export class DocumentService {
  /**
   * Extracts raw text from PDF, DOCX, DOC, TXT, MD, CSV, JSON, RTF, HTML buffer
   */
  public async extractText(buffer: Buffer, fileType: string, filename: string): Promise<ExtractionResult> {
    const ext = fileType.toLowerCase().replace('.', '').trim();

    try {
      if (ext === 'pdf') {
        return await this.extractPdfText(buffer, filename);
      } else if (ext === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        let text = result.value || '';
        if (!text.trim() && process.env.GEMINI_API_KEY) {
          text = await this.extractWithGemini(
            buffer,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename
          );
        }
        return {
          text: text || '',
          pageCount: 1,
        };
      } else if (ext === 'doc') {
        let text = '';
        if (process.env.GEMINI_API_KEY) {
          text = await this.extractWithGemini(buffer, 'application/msword', filename);
        }
        if (!text.trim()) {
          text = buffer.toString('utf-8').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
        }
        return { text: text || '', pageCount: 1 };
      } else if (ext === 'txt' || ext === 'md' || ext === 'tsv') {
        const text = buffer.toString('utf-8');
        return { text, pageCount: 1 };
      } else if (ext === 'csv') {
        const text = buffer.toString('utf-8');
        return { text, pageCount: 1 };
      } else if (ext === 'json') {
        const raw = buffer.toString('utf-8');
        try {
          const parsed = JSON.parse(raw);
          return { text: JSON.stringify(parsed, null, 2), pageCount: 1 };
        } catch {
          return { text: raw, pageCount: 1 };
        }
      } else if (ext === 'html' || ext === 'htm') {
        const raw = buffer.toString('utf-8');
        const stripped = raw
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&');
        return { text: stripped, pageCount: 1 };
      } else if (ext === 'rtf') {
        const raw = buffer.toString('utf-8');
        const stripped = raw.replace(/\\[a-z0-9-]+\s?/gi, '').replace(/[{}]/g, '');
        return { text: stripped, pageCount: 1 };
      } else {
        const text = buffer.toString('utf-8');
        return { text, pageCount: 1 };
      }
    } catch (err: any) {
      console.error(`Text extraction failed for ${filename}:`, err);
      throw new Error(`Failed to extract text from ${filename}: ${err.message || 'Unknown error'}`);
    }
  }

  private async extractPdfText(buffer: Buffer, filename: string): Promise<ExtractionResult> {
    let extractedText = '';
    let pageCount = 1;

    // 1. Try PDFParse from pdf-parse module
    try {
      const pdfModule = await import('pdf-parse');
      const PDFParseClass =
        (pdfModule as any).PDFParse ||
        (pdfModule as any).default?.PDFParse ||
        (typeof pdfModule === 'function' ? pdfModule : null);

      if (PDFParseClass && typeof PDFParseClass === 'function') {
        const parser = new (PDFParseClass as any)({ data: buffer });
        const data = await parser.getText();
        if (data && typeof data.text === 'string' && data.text.trim().length > 0) {
          extractedText = data.text;
          pageCount = data.total || (Array.isArray(data.pages) ? data.pages.length : 1);
        }
      } else if (typeof (pdfModule as any).default === 'function') {
        const data = await (pdfModule as any).default(buffer);
        if (data && data.text) {
          extractedText = data.text;
          pageCount = data.numpages || 1;
        }
      }
    } catch (parseErr: any) {
      console.warn(`PDFParse engine failed on ${filename}:`, parseErr.message);
    }

    // 2. If text is empty or very low (< 30 chars) and Gemini API is available (e.g. scanned PDF / complex font encoding)
    if ((!extractedText || extractedText.trim().length < 30) && process.env.GEMINI_API_KEY) {
      try {
        console.log(`Attempting Gemini multimodal PDF text extraction for ${filename}...`);
        const geminiText = await this.extractWithGemini(buffer, 'application/pdf', filename);
        if (geminiText && geminiText.trim().length > 0) {
          extractedText = geminiText;
        }
      } catch (geminiErr: any) {
        console.warn(`Gemini PDF extraction failed for ${filename}:`, geminiErr.message);
      }
    }

    // 3. Fallback: stream inspection
    if (!extractedText || extractedText.trim().length === 0) {
      try {
        const rawString = buffer.toString('binary');
        const textMatches = rawString.match(/\(([^)]{2,})\)\s*Tj/g) || [];
        if (textMatches.length > 0) {
          extractedText = textMatches
            .map(m => m.replace(/^\(/, '').replace(/\)\s*Tj$/, ''))
            .filter(t => t.length > 1)
            .join(' ');
        }
      } catch (streamErr: any) {
        console.warn(`Stream extraction failed for ${filename}:`, streamErr.message);
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error(`No readable textual content could be extracted from PDF '${filename}'. The file might be an image-only scan or encrypted.`);
    }

    return {
      text: extractedText,
      pageCount: Math.max(1, pageCount),
    };
  }

  private async extractWithGemini(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) return '';

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: buffer.toString('base64'),
                    mimeType,
                  },
                },
                {
                  text: `Extract all text, sections, bullet points, notices, and tables verbatim from this document "${filename}". Preserve all original wording, policies, numbers, and dates without commentary.`,
                },
              ],
            },
          ],
        });

        if (response.text && response.text.trim().length > 0) {
          return response.text.trim();
        }
      } catch (err: any) {
        console.warn(`[DocumentService] Multimodal extraction with ${modelName} failed:`, err.message);
      }
    }

    return '';
  }

  /**
   * Cleans and normalizes extracted document text
   */
  public cleanText(rawText: string): string {
    if (!rawText) return '';

    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '') // Remove pdf-parse page counters
      .replace(/[ \t]+/g, ' ') // Collapse multiple spaces and tabs
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines to at most 2
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove non-printable control chars
      .trim();
  }

  /**
   * Splits text into semantic chunks with overlap and page calculation
   */
  public chunkText(cleanedText: string, targetChunkSize = 900, overlap = 180, totalPages = 1): TextChunk[] {
    if (!cleanedText || cleanedText.length === 0) {
      return [];
    }

    // Split text into coherent paragraphs
    const paragraphs = cleanedText.split(/\n\n+/);
    const chunks: TextChunk[] = [];
    let currentChunkText = '';
    let currentChunkStartIdx = 0;
    let chunkCounter = 0;
    const totalLength = cleanedText.length;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (!para) continue;

      // If a single paragraph is larger than targetChunkSize, split by sentences
      if (para.length > targetChunkSize) {
        const sentences = para.split(/(?<=[.?!])\s+/);
        for (const sentence of sentences) {
          if ((currentChunkText + ' ' + sentence).length > targetChunkSize && currentChunkText.length > 0) {
            const approxProgress = currentChunkStartIdx / Math.max(1, totalLength);
            const approxPage = Math.max(1, Math.min(totalPages, Math.ceil(approxProgress * totalPages)));

            chunks.push({
              chunkIndex: chunkCounter++,
              text: currentChunkText.trim(),
              pageNumber: approxPage,
              tokenCount: Math.ceil(currentChunkText.length / 4),
            });

            // Keep overlap from previous text
            const words = currentChunkText.split(' ');
            const overlapWords = words.slice(-Math.max(10, Math.floor(overlap / 7))).join(' ');
            currentChunkText = overlapWords + ' ' + sentence;
            currentChunkStartIdx += currentChunkText.length - overlap;
          } else {
            currentChunkText = currentChunkText ? currentChunkText + ' ' + sentence : sentence;
          }
        }
      } else {
        if ((currentChunkText + '\n\n' + para).length > targetChunkSize && currentChunkText.length > 0) {
          const approxProgress = currentChunkStartIdx / Math.max(1, totalLength);
          const approxPage = Math.max(1, Math.min(totalPages, Math.ceil(approxProgress * totalPages)));

          chunks.push({
            chunkIndex: chunkCounter++,
            text: currentChunkText.trim(),
            pageNumber: approxPage,
            tokenCount: Math.ceil(currentChunkText.length / 4),
          });

          // Keep overlap
          const words = currentChunkText.split(' ');
          const overlapWords = words.slice(-Math.max(10, Math.floor(overlap / 7))).join(' ');
          currentChunkText = overlapWords + '\n\n' + para;
          currentChunkStartIdx += currentChunkText.length - overlap;
        } else {
          currentChunkText = currentChunkText ? currentChunkText + '\n\n' + para : para;
        }
      }
    }

    if (currentChunkText.trim().length > 0) {
      const approxProgress = currentChunkStartIdx / Math.max(1, totalLength);
      const approxPage = Math.max(1, Math.min(totalPages, Math.ceil(approxProgress * totalPages)));

      chunks.push({
        chunkIndex: chunkCounter++,
        text: currentChunkText.trim(),
        pageNumber: approxPage,
        tokenCount: Math.ceil(currentChunkText.length / 4),
      });
    }

    return chunks;
  }
}

export const documentService = new DocumentService();
