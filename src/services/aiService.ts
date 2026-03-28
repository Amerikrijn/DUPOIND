import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

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
  if (!genAI) {
    console.warn("Gemini API Key missing. Falling back to keyword logic.");
    return null; // Fallback to keyword-based logic in the component
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      `User says: ${userMsg}`
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
