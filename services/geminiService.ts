import { GoogleGenAI } from "@google/genai";

// Initialize the API client safely
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables. Mocking responses.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWorkflowSuggestions = async (userInput: string): Promise<string> => {
  const client = getClient();
  if (!client) {
    // Mock response if no API key
    return `Based on your request regarding "${userInput}", I suggest a 3-step workflow: 1. Data Ingestion via API, 2. Content Filtering using NLP, and 3. Human Review for final approval.`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert workflow consultant. The user wants to automate: "${userInput}". 
      Suggest a brief, numbered workflow list. Keep it concise.`,
    });
    return response.text || "I couldn't generate a suggestion right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI consultant.";
  }
};
