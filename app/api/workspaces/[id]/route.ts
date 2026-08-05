import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/services/workspace.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    const workspace = await workspaceService.getWorkspaceById(id);
    
    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workspace });
  } catch (error: any) {
    console.error(`GET /api/workspaces/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    const body = await request.json();
    const workspace = await workspaceService.updateWorkspace(id, body);
    
    return NextResponse.json({ success: true, data: workspace });
  } catch (error: any) {
    console.error(`PATCH /api/workspaces/[id] error:`, error);
    
    const status = error.message.includes("cannot be empty") || error.message.includes("not found") 
      ? 400 
      : 500;

    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;

    await workspaceService.deleteWorkspace(id);
    
    return NextResponse.json({ success: true, message: "Workspace deleted successfully" });
  } catch (error: any) {
    console.error(`DELETE /api/workspaces/[id] error:`, error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
