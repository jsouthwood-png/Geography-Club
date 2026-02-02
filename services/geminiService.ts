
import { GoogleGenAI, Type } from "@google/genai";
import { GeographyTopic, Question, Feedback } from "../types";

/**
 * Robustly extracts JSON from a potentially messy string.
 * Looks for the first '{' or '[' and the last '}' or ']'.
 */
const cleanJsonResponse = (text: string | undefined): string => {
  if (!text) return "";
  
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\n?|```/g, "").trim();
  
  // Find the actual JSON boundaries
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
  
  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);

  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  
  return cleaned;
};

/**
 * Safely accesses the API Key. 
 * Prevents ReferenceErrors in browser environments where 'process' is undefined.
 */
const getApiKey = () => {
  const env = (globalThis as any).process?.env || {};
  const key = env.API_KEY || (globalThis as any).API_KEY;
  
  if (!key || key === "undefined" || key === "null" || key.length < 5) {
    throw new Error("API_KEY_MISSING");
  }
  return key;
};

export const generateQuestion = async (topic: GeographyTopic): Promise<Question> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate one Edexcel GCSE Geography Specification A 3-mark question for the topic: ${topic}. 
      The question MUST start with "Explain one reason why..." or "Explain one way that...".
      It must require an initial point followed by two development steps.
      Return the result in strict JSON format.`,
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
              items: { type: Type.STRING },
              description: "3 steps: Point + Dev 1 + Dev 2"
            },
            modelAnswer: { type: Type.STRING }
          },
          required: ["id", "topic", "questionText", "markScheme", "modelAnswer"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");

    const cleaned = cleanJsonResponse(text);
    return JSON.parse(cleaned) as Question;
  } catch (error: any) {
    console.error("Generate Question Error:", error);
    if (error.message === "API_KEY_MISSING") throw error;
    if (error.message?.includes("404")) throw new Error("MODEL_UNAVAILABLE");
    if (error.message?.includes("403")) throw new Error("PERMISSION_DENIED");
    throw new Error("API_FAILURE");
  }
};

export const gradeAnswer = async (question: Question, answer: string): Promise<Feedback> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are an Edexcel GCSE Geography examiner. Grade this 3-mark response.
      Question: ${question.questionText}
      Student Answer: ${answer}
      
      Criteria:
      - 1 mark: Valid point.
      - 1 mark: First development step.
      - 1 mark: Second development step.`,
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

    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");

    return JSON.parse(cleanJsonResponse(text)) as Feedback;
  } catch (error: any) {
    console.error("Grade Answer Error:", error);
    throw error;
  }
};
