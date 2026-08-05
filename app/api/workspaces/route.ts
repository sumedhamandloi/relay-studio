import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/services/workspace.service";

export async function GET() {
  try {
    const workspaces = await workspaceService.getAllWorkspaces();
    return NextResponse.json({ success: true, data: workspaces });
  } catch (error: any) {
    console.error("GET /api/workspaces error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workspace = await workspaceService.createWorkspace(body);
    
    return NextResponse.json(
      { success: true, data: workspace },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/workspaces error:", error);
    
    // Simple heuristic for validation vs server errors
    const status = error.message.includes("cannot be empty") || error.message.includes("is required") 
      ? 400 
      : 500;

    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    );
  }
}
