import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export const GEMINI_MODEL_TEXT = "gemini-3.8-flash";
export const GEMINI_MODEL_EMBEDDING = "gemini-embedding-001";

/**
 * Generate embedding for text using gemini-embedding-001 (768 dims)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const ai = getGeminiClient();
  if (!ai) {
    // Deterministic mock embedding (768 dimensions) for offline/demo mode
    return mockEmbedding(text);
  }

  try {
    const response = await ai.models.embedContent({
      model: GEMINI_MODEL_EMBEDDING,
      contents: text,
      // Stored pi_document_chunks vectors are 768-dim; pin the output so
      // search-time embeddings always match (model default is now 3072).
      config: { outputDimensionality: 768 },
    });
    const embValues =
      response.embeddings?.[0]?.values ||
      (response as unknown as { embedding?: { values?: number[] } }).embedding?.values;
    if (embValues && Array.isArray(embValues)) {
      return embValues;
    }
    return mockEmbedding(text);
  } catch (err) {
    console.warn("Failed to generate embedding with Gemini API, falling back to mock:", err);
    return mockEmbedding(text);
  }
}

/**
 * Generates deterministic 768-dim pseudo embedding for development/fallback
 */
function mockEmbedding(text: string): number[] {
  const vec = new Array(768).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < 768; i++) {
    const val = Math.sin(hash + i * 31);
    vec[i] = Math.round(val * 10000) / 10000;
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
