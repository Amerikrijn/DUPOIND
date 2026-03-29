import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { getGeminiApiKey } from "../config/geminiEnv";

const SYSTEM_PROMPT = `
You are Dupo-Atlas, the intelligent cultural assistant for the DUPOIND Cultural Hub.
Your goal is to connect three squads: Utrecht (Netherlands), Lisbon (Portugal), and Chennai (India).

Guidelines:
1. Personality: Professional, yet warm, energetic, and culturally curious.
2. Language: Respond in the language the user speaks to you (Dutch, Portuguese, Tamil, or English).
3. Context: You know about the local weather, holidays, and cultural facts for these three cities.
4. Social: Encourage cross-team collaboration. If someone mentions a city, tell them something cool about another one.
5. Limits: Keep responses concise (max 3-4 sentences) as this is a chat interface.
6. Tone: Use relevant emojis to keep it "squad-like". 🌐🚀✨
`.trim();

export type AssistantErrorCode =
  | "missing_key"
  | "invalid_key"
  | "quota"
  | "permission"
  | "model_unavailable"
  | "safety_blocked"
  | "network"
  | "unknown";

export type AssistantResult =
  | { ok: true; text: string }
  | { ok: false; code: AssistantErrorCode; detail?: string };

function classifyFetchError(e: GoogleGenerativeAIFetchError): AssistantErrorCode {
  const status = e.status;
  const msg = (e.message || "").toLowerCase();
  if (status === 429 || msg.includes("resource exhausted") || msg.includes("quota")) {
    return "quota";
  }
  if (status === 403 || msg.includes("permission") || msg.includes("forbidden")) {
    return "permission";
  }
  if (
    status === 400 &&
    (msg.includes("api key not valid") ||
      msg.includes("invalid api key") ||
      msg.includes("invalid_argument"))
  ) {
    return "invalid_key";
  }
  if (status === 404 || msg.includes("not found") || msg.includes("was not found")) {
    return "model_unavailable";
  }
  if (msg.includes("blocked") || msg.includes("safety") || msg.includes("harm")) {
    return "safety_blocked";
  }
  if (status === 401) {
    return "invalid_key";
  }
  return "unknown";
}

function classifyUnknownError(e: unknown): AssistantErrorCode {
  if (e instanceof GoogleGenerativeAIFetchError) {
    return classifyFetchError(e);
  }
  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed")) {
    return "network";
  }
  return "unknown";
}

/**
 * Tries several model IDs (Google AI Studio / Generative Language API).
 * Order: newest stable first; versioned fallbacks avoid 404 when names change.
 */
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-1.5-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro",
  "gemini-1.5-pro-002",
];

export async function getAssistantResponse(userMsg: string): Promise<AssistantResult> {
  const API_KEY = getGeminiApiKey();

  if (!API_KEY) {
    return {
      ok: false,
      code: "missing_key",
      detail:
        "VITE_GEMINI_API_KEY is not set in the build. Add it in Vercel env and redeploy.",
    };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);

  let lastFailure: AssistantResult | null = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });
      const result = await model.generateContent(`User says: ${userMsg}`);
      const response = await result.response;
      const text = response.text();
      if (text?.trim()) {
        return { ok: true, text: text.trim() };
      }
    } catch (e: unknown) {
      if (import.meta.env.DEV) {
        console.warn(`[Dupo-Atlas] ${modelName}:`, e);
      }
      if (e instanceof GoogleGenerativeAIFetchError) {
        const code = classifyFetchError(e);
        const extra =
          e.errorDetails && e.errorDetails.length > 0
            ? ` ${JSON.stringify(e.errorDetails)}`
            : '';
        lastFailure = { ok: false, code, detail: e.message + extra };
        if (code === "model_unavailable") {
          continue;
        }
        if (code === "invalid_key" || code === "quota" || code === "permission") {
          return lastFailure;
        }
        if (code === "safety_blocked") {
          return lastFailure;
        }
        continue;
      }
      const code = classifyUnknownError(e);
      const detail = e instanceof Error ? e.message : String(e);
      lastFailure = { ok: false, code, detail };
      if (code === "network") {
        return lastFailure;
      }
    }
  }

  if (lastFailure) {
    return lastFailure;
  }

  return {
    ok: false,
    code: "model_unavailable",
    detail: "No Gemini model accepted the request. Enable Generative Language API and check model access.",
  };
}
