import { NextResponse } from "next/server";
import { ReferenceService } from "@/lib/services/reference.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json({ error: "topicId is required" }, { status: 400 });
    }

    const references = await ReferenceService.getReferences(topicId);
    return NextResponse.json(references);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference = await ReferenceService.createReference(body.topic_id, body);
    return NextResponse.json(reference, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
