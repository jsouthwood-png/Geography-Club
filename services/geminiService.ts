import { GoogleGenAI, Type } from "@google/genai";
import { GeographyTopic, Question, Feedback } from "../types";

/**
 * Helper to strip markdown code blocks from the model response.
 */
const cleanJsonResponse = (text: string | undefined): string => {
  if (!text) return "{}";
  return text.replace(/```json\n?|```/g, "").trim();
};

// Using the bridge defined in your vite.config.ts
const API_KEY = process.env.GEMINI_API_KEY;

export const generateQuestion = async (topic: GeographyTopic): Promise<Question> => {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined. Check your Vercel Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash', // Use stable 1.5-flash
    contents: `Generate a typical Edexcel GCSE Geography Specification A 3-mark question for the topic: ${topic}. 
    3-mark questions usually start with "Explain one reason why..." or "Explain one way that...".
    The question must require a point followed by two development steps.
    Provide the response in strict JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          questionText: { type: Type.STRING },
          markScheme: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          },
          modelAnswer: { type: Type.STRING }
        },
        required: ["id", "topic", "questionText", "markScheme", "modelAnswer"]
      }
    }
  });

  try {
    const cleaned = cleanJsonResponse(response.text);
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Invalid response format from AI");
  }
};

export const gradeAnswer = async (question: Question, answer: string): Promise<Feedback> => {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is missing");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro', // Use 1.5-pro for better grading accuracy
    contents: `As an Edexcel GCSE Geography examiner, grade this 3-mark student response.
    Question: ${question.questionText}
    Student Answer: ${answer}
    Criteria: 1 mark for point, 2 for development steps.
    Provide response in strict JSON format.`,
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

  try {
    const cleaned = cleanJsonResponse(response.text);
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Invalid feedback format from AI");
  }
};
