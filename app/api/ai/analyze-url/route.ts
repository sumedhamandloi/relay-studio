import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { URLExtractor } from "@/lib/services/extraction/url-extractor";
import { GeminiService } from "@/lib/services/ai/gemini";
import { UrlAnalysis } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, topicId } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "A valid URL is required" }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const supabase = await createClient();

    // 1. Check if already analyzed in Supabase
    const { data: existing } = await supabase
      .from("url_analyses")
      .select("*")
      .eq("url", cleanUrl)
      .maybeSingle();

    if (existing && existing.status === "analyzed") {
      return NextResponse.json({ success: true, data: existing, cached: true });
    }

    // 2. Extract normalized content using the multi-platform Extraction Layer
    const normalized = await URLExtractor.extract(cleanUrl);
    const platformType = normalized.platform;

    // 3. Call Gemini AI (routed through AIRouter to Flash)
    const aiAnalysis = await GeminiService.analyzeUrl(cleanUrl, normalized.rawText, platformType);

    // 4. Construct UrlAnalysis model matching DB schema and new platform fields
    const analysisRecord: UrlAnalysis = {
      id: existing?.id || crypto.randomUUID(),
      url: cleanUrl,
      type: platformType,
      title: aiAnalysis.title || normalized.title || "Analyzed Resource",
      creator: aiAnalysis.creator || normalized.creator || "Unknown",
      publish_date: aiAnalysis.publish_date || "Recently",
      duration: aiAnalysis.duration || (platformType === "youtube" ? "10 min" : undefined),
      language: aiAnalysis.language || "English",
      primary_topic: aiAnalysis.primary_topic || "General",
      overview: aiAnalysis.overview || [],
      main_ideas: aiAnalysis.main_ideas || [],
      detailed_breakdown: aiAnalysis.detailed_breakdown || [],
      reading_time_saved: aiAnalysis.reading_time_saved || "10 min",
      short_summary: aiAnalysis.short_summary || aiAnalysis.summary || "",
      key_takeaways: aiAnalysis.key_takeaways || aiAnalysis.key_points || [],
      timeline: aiAnalysis.timeline || [],
      important_quotes: aiAnalysis.important_quotes || [],
      topics_covered: aiAnalysis.topics_covered || [],
      people_mentioned: aiAnalysis.people_mentioned || [],
      technologies_mentioned: aiAnalysis.technologies_mentioned || [],
      resources_mentioned: aiAnalysis.resources_mentioned || [],
      // Platform-specific fields
      hook: aiAnalysis.hook,
      summary: aiAnalysis.summary,
      key_points: aiAnalysis.key_points,
      engagement_observations: aiAnalysis.engagement_observations,
      format: aiAnalysis.format,
      caption_analysis: aiAnalysis.caption_analysis,
      engagement_signals: aiAnalysis.engagement_signals,
      content_structure: aiAnalysis.content_structure,
      status: "analyzed",
      created_at: new Date().toISOString()
    };

    // 5. Save to Supabase url_analyses table
    const { error: dbError } = await supabase
      .from("url_analyses")
      .upsert(analysisRecord, { onConflict: "id" });

    if (dbError) {
      console.error("Failed to save to url_analyses:", dbError);
    }

    // 6. If linked to a topic, also create a research_reference
    if (topicId) {
      try {
        await supabase.from("research_references").insert({
          topic_id: topicId,
          title: analysisRecord.title,
          url: cleanUrl,
          source_type: platformType,
          notes: analysisRecord.short_summary,
          raw_content: normalized.rawText.slice(0, 15000)
        });
      } catch (refErr) {
        console.error("Failed to link reference to topic:", refErr);
      }
    }

    return NextResponse.json({ success: true, data: analysisRecord });
  } catch (error: any) {
    console.error("URL Analysis Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze URL" },
      { status: 500 }
    );
  }
}
