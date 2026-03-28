import { GoogleGenerativeAI } from "@google/generative-ai";

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
`;

export async function getAssistantResponse(userMsg: string): Promise<string | null> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.warn("Dupo-Atlas: VITE_GEMINI_API_KEY is missing from environment.");
    return null;
  }

  // Debug log (safe)
  console.log(`Dupo-Atlas diagnostic: Key detected (${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)})`);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Function to try a specific model
    const tryModel = async (modelName: string) => {
      try {
        console.log(`Dupo-Atlas: Trying AI model ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          SYSTEM_PROMPT,
          `User says: ${userMsg}`
        ]);
        const response = await result.response;
        return response.text();
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.warn(`Dupo-Atlas: ${modelName} attempt failed:`, errMsg);
        return null;
      }
    };

    // Attempt models in a specific priority order for maximum compatibility
    const modelsToTry = [
      "gemini-1.5-flash",        // Standard
      "gemini-pro",              // Legacy but stable
      "gemini-1.5-flash-8b",     // High availability
      "gemini-1.5-flash-latest"  // Sometimes required for newer keys
    ];

    let text = null;
    for (const modelName of modelsToTry) {
      text = await tryModel(modelName);
      if (text) {
        console.log(`Dupo-Atlas: ${modelName} success!`);
        break;
      }
    }

    if (!text) throw new Error("All Gemini models failed (404/Quota/Auth). Check GCP API library enablement.");
    return text;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Dupo-Atlas AI Error:", err.message);
    }
    return null;
  }
}
