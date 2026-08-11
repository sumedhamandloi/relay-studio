//adding comment to stage changes in route.ts
import { NextResponse } from "next/server";
import { WorkspaceService } from "@/lib/services/workspace.service";

export async function GET() {
  try {
    const workspaces = await WorkspaceService.getWorkspaces();
    return NextResponse.json(workspaces);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const workspace = await WorkspaceService.createWorkspace(body.title, body.description);
    return NextResponse.json(workspace, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
