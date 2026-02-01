import { GoogleGenAI, Type } from "@google/genai";
import { GeographyTopic, Question, Feedback } from "../types";

const cleanJsonResponse = (text: string | undefined): string => {
  if (!text) return "{}";
  return text.replace(/```json\n?|```/g, "").trim();
};

// This is the standard Vite way to get variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateQuestion = async (topic: GeographyTopic): Promise<Question> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash', 
    contents: `Generate an Edexcel GCSE Geography Spec A 3-mark question for: ${topic}. JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          questionText: { type: Type.STRING },
          markScheme: { type: Type.ARRAY, items: { type: Type.STRING } },
          modelAnswer: { type: Type.STRING }
        },
        required: ["id", "topic", "questionText", "markScheme", "modelAnswer"]
      }
    }
  });

  return JSON.parse(cleanJsonResponse(response.text));
};

export const gradeAnswer = async (question: Question, answer: string): Promise<Feedback> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: `Grade this geography answer: ${answer}. JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          comments: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedAnswer: { type: Type.STRING }
        },
        required: ["score", "comments", "strengths", "improvements", "suggestedAnswer"]
      }
    }
  });

  return JSON.parse(cleanJsonResponse(response.text));
};
