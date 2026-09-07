import { UrlAnalysis, ResearchSynthesisResult } from "@/types";
import { AIRouter } from "./ai-router";

export class GeminiService {
  /**
   * Specialized Analyzer for YouTube content
   * Model: Gemini Flash
   */
  static async analyzeYouTube(
    url: string,
    rawContent: string,
    providedKey?: string
  ): Promise<Partial<UrlAnalysis>> {
    const prompt = `
You are a senior YouTube content strategist and media analyst.
Analyze the provided YouTube video transcript, metadata, and description for URL: "${url}".

Return a structured JSON adhering EXACTLY to this schema:
{
  "title": "Clear, informative title of the video",
  "creator": "Channel or creator name",
  "overview": "High-level overview of the video's core narrative and intention.",
  "summary": "Concise summary of the key takeaways and discussion.",
  "timeline": [
    { "timestamp": "00:00", "description": "Key section, pivot or topic introduced" }
  ],
  "hook": "Analysis of the opening 30 seconds / hook used to grab attention.",
  "key_points": [
    "Important takeaway or thesis point 1",
    "Important takeaway or thesis point 2",
    "Important takeaway or thesis point 3"
  ],
  "engagement_observations": [
    "Observation on pacing, visual cues, or audience retention tactics",
    "Observation on call-to-action or community interaction"
  ],
  "primary_topic": "Main domain or topic category",
  "reading_time_saved": "12 min",
  "important_quotes": [
    "Impactful or memorable quote from the creator"
  ]
}

Source Content:
${rawContent.slice(0, 35000)}
`;

    const result = await AIRouter.callFlash<any>(prompt, {
      json: true,
      apiKey: providedKey,
      temperature: 0.3
    });

    return {
      ...result,
      type: "youtube",
      short_summary: result.summary || result.overview,
      key_takeaways: result.key_points || []
    };
  }

  /**
   * Specialized Analyzer for Instagram content (Reels / Posts)
   * Model: Gemini Flash
   */
  static async analyzeInstagram(
    url: string,
    rawContent: string,
    providedKey?: string
  ): Promise<Partial<UrlAnalysis>> {
    const prompt = `
You are a top Instagram growth and visual storytelling strategist.
Analyze the following Instagram content, caption, and metadata for URL: "${url}".

Return a structured JSON adhering EXACTLY to this schema:
{
  "title": "Informative title or headline describing the post",
  "creator": "Creator handle or username (e.g. @handle)",
  "hook": "Detailed breakdown of the opening visual/text hook that stops the scroll.",
  "format": "Reel | Carousel | Single Photo | Story Highlight",
  "caption_analysis": "Critique of caption structure, storytelling technique, hashtags, and CTA.",
  "engagement_signals": [
    "Signal 1: High save-rate mechanism (e.g. actionable checklist)",
    "Signal 2: Share-trigger (e.g. relatable industry dilemma)",
    "Signal 3: Comment prompt or controversy element"
  ],
  "content_structure": [
    "Step 1: Hook / Problem identification",
    "Step 2: Value delivery or proof",
    "Step 3: Call-to-action or payoff"
  ],
  "key_takeaways": [
    "Actionable takeaway 1",
    "Actionable takeaway 2"
  ],
  "primary_topic": "Content category (e.g. Design, AI, Fitness)",
  "short_summary": "One-paragraph summary of the post's core message."
}

Source Content:
${rawContent.slice(0, 25000)}
`;

    const result = await AIRouter.callFlash<any>(prompt, {
      json: true,
      apiKey: providedKey,
      temperature: 0.3
    });

    return {
      ...result,
      type: "instagram",
      overview: result.caption_analysis || result.short_summary
    };
  }

  /**
   * Universal Analyzer for Web Articles, X / LinkedIn, and Generic URLs
   * Model: Gemini Flash
   */
  static async analyzeGeneric(
    url: string,
    rawContent: string,
    platform: "twitter" | "linkedin" | "reddit" | "github" | "generic",
    providedKey?: string
  ): Promise<Partial<UrlAnalysis>> {
    const prompt = `
You are an expert research analyst. Analyze the following content from "${url}" (Platform: ${platform}).
Generate a comprehensive, structured analysis in JSON format adhering strictly to this schema:

{
  "title": "Clear, informative title",
  "creator": "Author, handle, or organization",
  "publish_date": "Date or 'Recently'",
  "duration": "Estimated read duration (e.g. '5 min')",
  "language": "Primary language",
  "primary_topic": "Main topic",
  "reading_time_saved": "Estimated time saved (e.g. '8 min')",
  "short_summary": "A concise executive summary",
  "overview": [
    "Context and thesis paragraph",
    "Core arguments and evidence paragraph"
  ],
  "main_ideas": [
    { "heading": "Key Concept", "explanation": "Explanation of concept" }
  ],
  "detailed_breakdown": [
    { "section": "Section Name", "content": "Detailed breakdown" }
  ],
  "key_takeaways": [
    "Key takeaway 1",
    "Key takeaway 2",
    "Key takeaway 3"
  ],
  "important_quotes": [
    "Verbatim notable quote"
  ],
  "topics_covered": ["Topic 1", "Topic 2"],
  "people_mentioned": [],
  "technologies_mentioned": [],
  "resources_mentioned": []
}

Source Content:
${rawContent.slice(0, 30000)}
`;

    const result = await AIRouter.callFlash<any>(prompt, {
      json: true,
      apiKey: providedKey,
      temperature: 0.3
    });

    return {
      ...result,
      type: platform
    };
  }

  /**
   * Router: Analyzes any URL content by directing it to the right platform analyzer
   */
  static async analyzeUrl(
    url: string,
    rawContent: string,
    platformType: UrlAnalysis["type"] = "generic",
    providedKey?: string
  ): Promise<Partial<UrlAnalysis>> {
    if (platformType === "youtube") {
      return this.analyzeYouTube(url, rawContent, providedKey);
    }
    if (platformType === "instagram") {
      return this.analyzeInstagram(url, rawContent, providedKey);
    }
    return this.analyzeGeneric(url, rawContent, platformType as any, providedKey);
  }

  /**
   * Research Synthesis: Synthesizes multiple source references into a unified research document
   * Model: Gemini Flash (Primary)
   */
  static async synthesizeResearch(
    topicTitle: string,
    sources: Array<{ title: string; url?: string; content: string }>,
    providedKey?: string
  ): Promise<ResearchSynthesisResult & Record<string, any>> {
    const formattedSources = sources
      .map(
        (s, idx) =>
          `[Source #${idx + 1}: ${s.title}] (${s.url || "Manual"})\n${(s.content || "").slice(0, 7000)}`
      )
      .join("\n\n---\n\n");

    const prompt = `
You are a senior investigative researcher and analyst. 
Synthesize all the provided research sources for the topic: "${topicTitle}".

Return an exhaustive, highly structured research synthesis adhering STRICTLY to this JSON schema:

{
  "overview": "Deep, comprehensive synthesis of the current state, core thesis, and fundamental problem space of this topic.",
  "key_findings": [
    "Specific empirical finding or proven trend 1",
    "Specific empirical finding or proven trend 2",
    "Specific empirical finding or proven trend 3",
    "Specific empirical finding or proven trend 4"
  ],
  "contradictions": [
    "Contradiction or debate between different sources/experts on this topic",
    "Disputed claims or conflicting data points"
  ],
  "sources": [
    {
      "id": "1",
      "title": "Source name or title",
      "url": "URL if available",
      "domain": "Domain or publication",
      "summary": "Key contribution of this source to the topic",
      "confidenceScore": 92
    }
  ],
  "takeaways": [
    "Actionable takeaway or forward-looking implication 1",
    "Actionable takeaway or forward-looking implication 2",
    "Actionable takeaway or forward-looking implication 3"
  ],
  "community_opinions": [
    {
      "id": "1",
      "viewpoint": "Dominant developer/industry sentiment",
      "summary": "What people are actively discussing",
      "sourceType": "other"
    }
  ],
  "popular_videos": [],
  "misconceptions": [
    {
      "id": "1",
      "myth": "Common misconception about this topic",
      "reality": "Factual reality based on evidence"
    }
  ],
  "contrarian_angles": [
    {
      "id": "1",
      "angle": "Unconventional or contrarian perspective",
      "explanation": "Why this perspective might be true or valuable"
    }
  ],
  "statistics": [
    {
      "id": "1",
      "metric": "Key metric or adoption stat",
      "value": "e.g. 78%",
      "context": "Context for this metric"
    }
  ]
}

Provided Sources:
${formattedSources.slice(0, 45000)}
`;

    const result = await AIRouter.callFlash<any>(prompt, {
      json: true,
      apiKey: providedKey,
      temperature: 0.35
    });

    // Normalize backward-compatibility for overview if passed as string or object
    if (typeof result.overview !== "string") {
      result.overview = result.overview?.summary || result.overview?.overview || String(result.overview || "");
    }

    // Map sources/important_sources safely
    const rawSources = result.sources || result.important_sources || [];
    result.sources = (Array.isArray(rawSources) ? rawSources : []).map((s: any, idx: number) => {
      let domain = s.domain;
      if (!domain && s.url && s.url.startsWith("http")) {
        try {
          domain = new URL(s.url).hostname.replace("www.", "");
        } catch {
          domain = "Reference";
        }
      }
      return {
        id: String(s.id || idx + 1),
        title: s.title || "Reference",
        domain: domain || "Reference",
        summary: s.summary || "",
        url: s.url || "#",
        confidenceScore: typeof s.confidenceScore === "number" ? s.confidenceScore : 92,
        readingTime: s.readingTime || "3 min read"
      };
    });

    // Ensure all other arrays exist
    result.key_findings = Array.isArray(result.key_findings) ? result.key_findings : [];
    result.contradictions = Array.isArray(result.contradictions) ? result.contradictions : [];
    result.takeaways = Array.isArray(result.takeaways) ? result.takeaways : [];
    result.community_opinions = Array.isArray(result.community_opinions) ? result.community_opinions : [];
    result.popular_videos = Array.isArray(result.popular_videos) ? result.popular_videos : [];
    result.misconceptions = Array.isArray(result.misconceptions) ? result.misconceptions : [];
    result.contrarian_angles = Array.isArray(result.contrarian_angles) ? result.contrarian_angles : [];
    result.statistics = Array.isArray(result.statistics) ? result.statistics : [];

    return result;
  }
}
