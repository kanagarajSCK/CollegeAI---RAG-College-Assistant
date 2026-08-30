import { GoogleGenAI } from '@google/genai';

export interface LLMResponse {
  answer: string;
  finishReason?: string;
}

export class LLMService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  private getClient(): GoogleGenAI | null {
    if (!this.ai && process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.ai;
  }

  /**
   * Generates a grounded answer based on retrieved context and user query
   */
  public async generateAnswer(
    question: string,
    context: string,
    chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<LLMResponse> {
    const client = this.getClient();

    if (!context || context.trim().length === 0) {
      return {
        answer: "I couldn't find any relevant information in your uploaded college documents. Please make sure the relevant document (such as handbook, calendar, hostel rules, or syllabus) is uploaded and indexed in the Documents section.",
      };
    }

    const systemInstruction = `You are a reliable, professional College Information Assistant powered by RAG (Retrieval-Augmented Generation).

CRITICAL DIRECTIVES:
1. Answer the student's question using ONLY the information provided in the "Retrieved College Document Context" below.
2. If the exact answer cannot be found in or deduced from the provided documents, state clearly:
"I couldn't find this information in the uploaded college documents."
3. DO NOT invent dates, fees, rules, or policies. Minimize hallucinations at all costs.
4. Structure your response clearly using Markdown:
   - Use bold key phrases and headings for structure
   - Use bullet points or numbered lists for sequential steps, criteria, or document lists
   - Use Markdown tables when comparing fees, dates, or schedules
5. Keep the explanation concise, professional, and directly helpful to the student.
6. Always refer strictly to the retrieved facts.`;

    const recentHistoryText = chatHistory.slice(-4).map(h => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.content}`).join('\n\n');

    const prompt = `--- RETRIEVED COLLEGE DOCUMENT CONTEXT ---
${context}
-----------------------------------------

${recentHistoryText ? `Recent Conversation History:\n${recentHistoryText}\n\n` : ''}Current Student Question: ${question}

Provide an accurate, grounded answer based strictly on the retrieved context above:`;

    if (!client) {
      // Fallback local extractive summarizer if API key is not yet set
      return {
        answer: `Based on your uploaded college documents:\n\n${this.formatExtractiveAnswer(question, context)}\n\n*(Note: Attach your Gemini API key in Settings > Secrets to activate real-time generative reasoning)*`,
      };
    }

    // High availability candidate models from @google/genai SDK
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.7-flash',
      'gemini-flash-latest',
    ];

    let lastError: any = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.2, // Low temperature for high factual accuracy and low hallucination
            },
          });

          const text = response.text?.trim();
          if (text && text.length > 0) {
            return { answer: text };
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || '';
          const errMsg = err?.message || String(err);
          const isHighDemandOrRateLimit =
            status === 503 ||
            status === 'UNAVAILABLE' ||
            status === 429 ||
            status === 'RESOURCE_EXHAUSTED' ||
            errMsg.includes('503') ||
            errMsg.includes('high demand') ||
            errMsg.includes('quota');

          console.warn(`[LLMService] Model ${modelName} attempt ${attempt} failed:`, errMsg);

          if (isHighDemandOrRateLimit && attempt === 1) {
            // Wait 500ms before retrying the same or next model
            await new Promise(r => setTimeout(r, 600));
            continue;
          }
          // If attempt 2 or other error, break to next candidate model
          break;
        }
      }
    }

    // If all remote models are temporarily unavailable (e.g. 503 high demand spike),
    // gracefully synthesize an answer directly from the retrieved document chunks
    console.warn('[LLMService] All candidate models failed, providing grounded context fallback:', lastError?.message);
    const extractiveFallback = this.formatExtractiveAnswer(question, context);
    return {
      answer: `${extractiveFallback}\n\n*Note: High demand on remote AI reasoning server; response synthesized directly from your verified document chunks.*`,
    };
  }

  /**
   * Generates a clean structured answer directly from retrieved chunks if remote LLM is temporarily unreachable
   */
  private formatExtractiveAnswer(question: string, context: string): string {
    // Extract key sentences and paragraphs from context
    const cleanContext = context
      .replace(/\[Source #\d+ \| Document: "[^"]+" \| Page: \d+ \| Chunk: \d+\]/g, '')
      .replace(/---/g, '')
      .trim();

    const lines = cleanContext
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 20);

    const uniqueLines = Array.from(new Set(lines)).slice(0, 8);

    if (uniqueLines.length === 0) {
      return `Here are the relevant details found in your college documents:\n\n${cleanContext.slice(0, 600)}...`;
    }

    return `Here is what was found in your indexed college documents regarding **"${question}"**:\n\n` +
      uniqueLines.map(line => `• ${line}`).join('\n\n');
  }
}

export const llmService = new LLMService();
