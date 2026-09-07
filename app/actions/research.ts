"use server";

import { ResearchGenerator } from "@/lib/services/ai/research-generator";

export async function generateResearchAction(topicId: string, providedApiKey?: string) {
  try {
    const apiKey = providedApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Get your free student API key at https://aistudio.google.com/apikey and add it to your .env.local"
      );
    }
    const researchData = await ResearchGenerator.generateResearch(topicId, apiKey);
    return { success: true, data: researchData };
  } catch (error: any) {
    console.error("Action error generating research:", error);
    return { success: false, error: error.message || "Failed to generate research" };
  }
}
