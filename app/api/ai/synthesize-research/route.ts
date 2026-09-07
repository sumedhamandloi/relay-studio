import { NextResponse } from "next/server";
import { ResearchGenerator } from "@/lib/services/ai/research-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topicId, apiKey } = body;

    if (!topicId) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    const researchData = await ResearchGenerator.generateResearch(topicId, apiKey);
    return NextResponse.json({ success: true, data: researchData });
  } catch (error: any) {
    console.error("Synthesize Research API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synthesize research" },
      { status: 500 }
    );
  }
}
