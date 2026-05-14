import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MemeCaption {
  caption: string;
  explanation?: string;
}

export async function generateMagicCaptions(base64Image: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
          {
            text: "Analyze this image and suggest 5 hilarious, witty, and contextually relevant meme captions. The captions should be punchy and fit well in a standard meme format (top/bottom text or overlay). Provide only the captions as a JSON array of strings.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    try {
      const captions = JSON.parse(text);
      return Array.isArray(captions) ? captions : [];
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return [];
    }
  } catch (error) {
    console.error("Error generating magic captions:", error);
    throw error;
  }
}
