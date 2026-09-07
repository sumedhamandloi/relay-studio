import { ReferenceRepository } from "@/lib/repositories/reference.repository";
import { TopicRepository } from "@/lib/repositories/topic.repository";
import { URLExtractor } from "../extraction/url-extractor";
import { GeminiService } from "./gemini";
import { createClient } from "@/lib/supabase/server";

export class ResearchGenerator {
  /**
   * Orchestrates the extraction of references and generates a structured ResearchData object
   * using Gemini AI, saving into research_documents and updating the topic.
   */
  static async generateResearch(topicId: string, providedApiKey?: string): Promise<any> {
    try {
      // 1. Fetch Topic to get workspace and title
      const topic = await TopicRepository.getTopicById(topicId);
      if (!topic) {
        throw new Error("Topic not found.");
      }

      // 2. Fetch References (optional)
      const references = await ReferenceRepository.getReferences(topicId);
      const sourcesForAi: Array<{ title: string; url?: string; content: string }> = [];

      if (references && references.length > 0) {
        // 3. Extract missing raw content if URL exists
        for (const ref of references) {
          let content = ref.raw_content || ref.summary || "";

          if (!content && ref.url) {
            try {
              console.log(`Extracting content for: ${ref.url}`);
              const normalized = await URLExtractor.extract(ref.url);
              content = normalized.rawText;
              
              // Save it back to db so we don't have to extract again
              await ReferenceRepository.updateReference(ref.id, {
                raw_content: content.substring(0, 15000),
              });
            } catch (e) {
              console.error(`Failed to extract ${ref.url}:`, e);
              content = `Title: ${ref.title}. Source: ${ref.url}`;
            }
          }

          sourcesForAi.push({
            title: ref.title,
            url: ref.url,
            content: content || ref.title,
          });
        }
      } else {
        // Autonomous research mode: Gather research directly for topic
        sourcesForAi.push({
          title: topic.title,
          content: `Topic to research: "${topic.title}". Please generate comprehensive foundational research, verified empirical findings, community debates, key sources, and takeaways.`
        });
      }

      // 4. Call Gemini AI to synthesize research
      console.log(`Calling Gemini to synthesize research for: "${topic.title}"...`);
      const researchData = await GeminiService.synthesizeResearch(
        topic.title,
        sourcesForAi,
        providedApiKey
      );

      // 5. Save into research_notes table linked to topicId for instant retrieval
      const supabase = await createClient();
      try {
        await supabase
          .from("research_notes")
          .delete()
          .eq("topic_id", topicId)
          .eq("title", "__AI_RESEARCH_DATA__");

        const { error: noteError } = await supabase.from("research_notes").insert({
          topic_id: topicId,
          title: "__AI_RESEARCH_DATA__",
          content: JSON.stringify(researchData)
        });

        if (noteError) {
          console.error("Error inserting research data into research_notes:", noteError);
        }
      } catch (err) {
        console.warn("Could not save to research_notes table:", err);
      }

      // Also save to research_documents if table exists
      try {
        await supabase.from("research_documents").insert({
          workspace_id: topic.workspace_id,
          research_json: researchData,
        });
      } catch (err) {
        // research_documents is optional
      }

      // 6. Update topic status to completed and attach research_data if column exists
      try {
        await TopicRepository.updateTopic(topicId, {
          status: "completed",
        });
      } catch (err) {
        console.warn("Could not update topic status:", err);
      }

      return researchData;
    } catch (error) {
      console.error("Error in ResearchGenerator.generateResearch:", error);
      throw error;
    }
  }
}
