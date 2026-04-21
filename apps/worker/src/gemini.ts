/**
 * Gemini summarization + entity extraction.
 *
 * Uses Gemini 2.5 Flash with structured JSON output.
 * Why Flash: cheap (~$0.0003 per article), fast (~1s), quality is plenty for 60-word summaries.
 * Swap model via GEMINI_MODEL env var if you want to A/B test Pro.
 *
 * Cost estimate at 500 articles/day:
 *   ~15k tokens in + ~100 tokens out per call
 *   ~$0.0003 per article × 500 × 30 days ≈ $4.50/month. Trivial.
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GeminiSummary, GeminiSummarySchema } from '@shortfoot/shared/schemas';

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY required');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Structured output schema — Gemini will conform to this
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: 'A 55-60 word neutral-tone summary of the article. Lead with the news. No opinion, no commentary.',
    },
    entities: {
      type: SchemaType.OBJECT,
      properties: {
        leagues: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'League/competition names mentioned (e.g., "Premier League", "Champions League")',
        },
        teams: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Club/team names mentioned (e.g., "Arsenal", "Real Madrid")',
        },
        players: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Player names mentioned (e.g., "Bukayo Saka", "Vinícius Jr")',
        },
      },
      required: ['leagues', 'teams', 'players'],
    },
  },
  required: ['summary', 'entities'],
};

const SYSTEM_INSTRUCTION = `You are a football news summarizer. For each article:

1. Write a 55-60 word summary. Neutral, factual tone. Lead with the news itself. No speculation, no opinion, no "reports suggest" hedging unless the original is explicitly rumor-based.

2. Extract all football entities mentioned:
   - leagues: competition names (Premier League, La Liga, Champions League, FA Cup, etc.)
   - teams: clubs or national teams (Arsenal, Brazil, etc.) — use the common English name
   - players: full name as commonly known (Bukayo Saka, Vinícius Jr, etc.)

Do not include managers, referees, or pundits in players. Only on-field footballers.
Do not invent entities not in the text. Be precise.`;

export type GeminiInput = {
  headline: string;
  body: string; // full article text or RSS description
  publisher: string;
};

export async function summarizeAndTag(
  input: GeminiInput
): Promise<GeminiSummary> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as any,
      temperature: 0.2, // low temp — we want factual, deterministic output
      // Gemini 2.5 Flash "thinking tokens" count against this budget; headroom matters.
      maxOutputTokens: 4000,
    },
  });

  const prompt = `Publisher: ${input.publisher}
Headline: ${input.headline}

Article:
${input.body}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`Gemini returned non-JSON: ${text.slice(0, 200)}`);
  }

  const validated = GeminiSummarySchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Gemini output failed schema: ${validated.error.message}`);
  }

  // Post-validation sanity checks
  const wordCount = validated.data.summary.trim().split(/\s+/).length;
  if (wordCount < 40 || wordCount > 75) {
    console.warn(`Summary word count out of range (${wordCount}): ${validated.data.summary}`);
    // Don't throw — just log. Gemini is usually close enough.
  }

  return validated.data;
}
