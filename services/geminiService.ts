
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  let key = '';
  
  // Try process.env (for SSR/build time)
  try {
    if (typeof process !== 'undefined' && process.env) {
      key = process.env.GEMINI_API_KEY || '';
    }
  } catch (e) {}
  
  // Try import.meta.env (for Vite)
  if (!key) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        key = import.meta.env.GEMINI_API_KEY || '';
      }
    } catch (e) {}
  }
  return key;
};

const apiKey = getApiKey() || 'mock-key';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey });

export const generateShopDescription = async (name: string, vibes: string[], city: string): Promise<string> => {
  // Return fallback if no key is present
  if (apiKey === 'mock-key') {
    return `A wonderful coffee shop named ${name} located in ${city}. Known for being ${vibes.join(', ')}.`;
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Write a short, aesthetic, and catchy description (max 2 sentences) for a coffee shop named "${name}" in ${city}. The vibe is: ${vibes.join(', ')}.`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || 'A hidden gem waiting to be discovered.';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `A fantastic spot in ${city} known for ${vibes.join(', ')}.`;
  }
};
