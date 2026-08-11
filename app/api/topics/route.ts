import { NextResponse } from "next/server";
import { TopicService } from "@/lib/services/topic.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const topics = await TopicService.getTopics(workspaceId);
    return NextResponse.json(topics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = await TopicService.createTopic(body.workspace_id, body.title, body.description);
    return NextResponse.json(topic, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
