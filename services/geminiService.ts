
import { GoogleGenAI, Type } from "@google/genai";
import { GeographyTopic, Question, Feedback } from "../types";

/**
 * Helper to strip markdown code blocks from the model response.
 * Occasionally models wrap JSON in ```json blocks despite config.
 */
const cleanJsonResponse = (text: string | undefined): string => {
  if (!text) return "{}";
  return text.replace(/```json\n?|```/g, "").trim();
};

/**
 * Generates an exam-style 3-mark geography question.
 * Uses gemini-3-flash-preview for efficient text generation.
 */
export const generateQuestion = async (topic: GeographyTopic): Promise<Question> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
            items: { type: Type.STRING },
            description: "A list of 3 bullet points showing how the 3 marks are awarded (Point + Dev 1 + Dev 2)"
          },
          modelAnswer: { type: Type.STRING, description: "A perfect 3-mark response using connective words." }
        },
        required: ["id", "topic", "questionText", "markScheme", "modelAnswer"]
      }
    }
  });

  try {
    const cleaned = cleanJsonResponse(response.text);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse question JSON:", response.text);
    throw new Error("Invalid response format from AI");
  }
};

/**
 * Grades a student's response based on Edexcel 3-mark criteria.
 * Uses gemini-3-pro-preview for high-quality pedagogical feedback.
 */
export const gradeAnswer = async (question: Question, answer: string): Promise<Feedback> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `As an Edexcel GCSE Geography examiner, grade this 3-mark student response.
    Question: ${question.questionText}
    Student Answer: ${answer}
    
    Criteria:
    - 1 mark for a valid identified point/reason.
    - 2 further marks for clear sequential development (connected explanation).
    
    Provide the response in strict JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Score out of 3" },
          comments: { type: Type.STRING, description: "Overall summary of the response" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific steps to reach the next mark" },
          suggestedAnswer: { type: Type.STRING, description: "How the student could have phrased their specific point better for full marks." }
        },
        required: ["score", "comments", "strengths", "improvements", "suggestedAnswer"]
      }
    }
  });

  try {
    const cleaned = cleanJsonResponse(response.text);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse feedback JSON:", response.text);
    throw new Error("Invalid feedback format from AI");
  }
};
