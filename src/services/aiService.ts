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
    
    // Attempt 1: Gemini 1.5 Flash (Latest)
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    } catch {
      // Attempt 2: Pro fallback
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
    }
    
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `User says: ${userMsg}`
    ]);
    
    const response = await result.response;
    const text = response.text();
    if (!text) throw new Error("Empty response from Gemini");
    return text;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Dupo-Atlas Gemini SDK Error:", err.message);
      
      // If we got a 404, maybe try one more specific legacy model or log clearly
      if (err.message.includes("404") || err.message.includes("not found")) {
        console.warn("Dupo-Atlas: Model not found. This key might only have access to specific models. Telling user to check GCP console.");
      }
    } else {
      console.error("Dupo-Atlas Unknown Error:", err);
    }
    return null;
  }
}
