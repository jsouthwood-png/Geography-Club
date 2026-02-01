import { GoogleGenerativeAI } from "@google/generative-ai"; // Standard SDK import
import { GeographyTopic, Question, Feedback } from "../types";

/**
 * Note: Ensure your Vercel Environment Variable is named: VITE_API_KEY
 * and your code is deployed using Vite.
 */
const API_KEY = import.meta.env.VITE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const cleanJsonResponse = (text: string | undefined): string => {
  if (!text) return "{}";
  // Removes markdown code blocks if the model accidentally includes them
  return text.replace(/```json\n?|```/g, "").trim();
};

export const generateQuestion = async (topic: GeographyTopic): Promise<Question> => {
  // Using gemini-1.5-flash for speed and cost-efficiency in question generation
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `Generate a typical Edexcel GCSE Geography Specification A 3-mark question for the topic: ${topic}. 
    3-mark questions usually start with "Explain one reason why..." or "Explain one way that...".
    The question must require a point followed by two development steps.
    Provide the response in strict JSON format following this schema:
    { "id": "string", "topic": "string", "questionText": "string", "markScheme": ["string"], "modelAnswer": "string" }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  try {
    const cleaned = cleanJsonResponse(response.text());
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", response.text());
    throw new Error("AI returned an unreadable format.");
  }
};

export const gradeAnswer = async (question: Question, answer: string): Promise<Feedback> => {
  // Using gemini-1.5-pro for higher reasoning capabilities in grading
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `As an Edexcel GCSE Geography examiner, grade this 3-mark student response.
    Question: ${question.questionText}
    Student Answer: ${answer}
    
    Criteria:
    - 1 mark for a valid identified point/reason.
    - 2 further marks for clear sequential development (connected explanation).
    
    Provide response in strict JSON:
    { "score": number, "comments": "string", "strengths": ["string"], "improvements": ["string"], "suggestedAnswer": "string" }`;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  try {
    const cleaned = cleanJsonResponse(response.text());
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Grading failed due to formatting.");
  }
};
