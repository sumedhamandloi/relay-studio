"use server";

import { ResearchGenerator } from "@/lib/services/ai/research-generator";

export async function generateResearchAction(topicId: string, providedApiKey?: string) {
  try {
    const apiKey = providedApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API Key is required to generate research. Please set it in .env.local or provide it in the UI.");
    }
    const researchData = await ResearchGenerator.generateResearch(topicId, apiKey);
    return { success: true, data: researchData };
  } catch (error: any) {
    console.error("Action error generating research:", error);
    return { success: false, error: error.message || "Failed to generate research" };
  }
}
