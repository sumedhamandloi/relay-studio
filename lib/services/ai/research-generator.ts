import { ReferenceService } from "../reference.service";
import { TopicService } from "../topic.service";
import { URLExtractor } from "../extraction/url-extractor";

export class ResearchGenerator {
  /**
   * Orchestrates the extraction of URLs and generates a structured ResearchData object
   * using an LLM. 
   */
  static async generateResearch(topicId: string, apiKey: string): Promise<any> {
    try {
      // 1. Fetch References
      const references = await ReferenceService.getReferences(topicId);
      if (!references || references.length === 0) {
        throw new Error("No references found for this topic. Please add some links first.");
      }

      // 2. Extract missing raw content
      let aggregatedContent = "";
      for (const ref of references) {
        if (!ref.raw_content && ref.url) {
          try {
            console.log(`Extracting content for: ${ref.url}`);
            const text = await URLExtractor.extract(ref.url);
            
            // Save it back to db so we don't have to extract again
            await ReferenceService.updateReference(ref.id, { raw_content: text.substring(0, 15000) });
            ref.raw_content = text;
          } catch (e) {
            console.error(`Failed to extract ${ref.url}:`, e);
          }
        }
        aggregatedContent += `\n\n--- Source: ${ref.title} (${ref.url || "Manual"}) ---\n`;
        aggregatedContent += (ref.raw_content || ref.summary || "").substring(0, 5000);
      }

      // 3. Call LLM (OpenAI as default stub, passing standard JSON schema)
      console.log("Calling LLM to synthesize research...");
      
      const systemPrompt = `You are a research synthesis AI. Analyze the provided sources and generate a structured JSON output matching this exact format:
{
  "overview": { "summary": "...", "keyTakeaways": ["..."] },
  "sources": [{ "id": "1", "title": "...", "url": "...", "type": "...", "keyPoints": ["..."], "biasOrAngle": "..." }],
  "community_opinions": { "consensus": "...", "debates": [{ "topic": "...", "sides": ["..."] }], "sentiment": "..." },
  "popular_videos": [{ "title": "...", "channel": "...", "views": "...", "url": "...", "hooks": ["..."] }],
  "misconceptions": [{ "myth": "...", "reality": "...", "source": "..." }],
  "contrarian_angles": [{ "angle": "...", "rationale": "...", "potential_audience": "..." }],
  "statistics": [{ "stat": "...", "context": "...", "source": "..." }]
}
Output ONLY valid JSON. No markdown wrappers like \`\`\`json.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Please synthesize the following research materials:\n\n${aggregatedContent}` }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`LLM Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const generatedJsonStr = data.choices[0].message.content;
      const researchData = JSON.parse(generatedJsonStr);

      // 4. Save to DB
      await TopicService.updateTopic(topicId, { research_data: researchData });
      
      return researchData;

    } catch (error) {
      console.error("Error generating research:", error);
      throw error;
    }
  }
}
