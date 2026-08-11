import { WorkspaceRepository } from "@/lib/repositories/workspace.repository";
import { Workspace } from "@/types";

export class WorkspaceService {
  static async getWorkspaces(): Promise<Workspace[]> {
    try {
      return await WorkspaceRepository.getWorkspaces();
    } catch (error) {
      console.error("WorkspaceService.getWorkspaces error:", error);
      throw new Error("Failed to fetch workspaces");
    }
  }

  static async getWorkspaceById(id: string): Promise<Workspace> {
    if (!id) throw new Error("Workspace ID is required");
    try {
      return await WorkspaceRepository.getWorkspaceById(id);
    } catch (error) {
      console.error("WorkspaceService.getWorkspaceById error:", error);
      throw new Error("Failed to fetch workspace");
    }
  }

  static async createWorkspace(title: string, description?: string): Promise<Workspace> {
    if (!title || title.trim() === "") {
      throw new Error("Workspace title is required");
    }
    
    // Default workspace logic
    const workspace = {
      title,
      description: description || "",
      is_pinned: false
    };

    try {
      return await WorkspaceRepository.createWorkspace(workspace);
    } catch (error) {
      console.error("WorkspaceService.createWorkspace error:", error);
      throw new Error("Failed to create workspace");
    }
  }

  static async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    if (!id) throw new Error("Workspace ID is required");
    
    const safeUpdates = { ...updates, updated_at: new Date().toISOString() };
    delete safeUpdates.id;

    try {
      return await WorkspaceRepository.updateWorkspace(id, safeUpdates);
    } catch (error) {
      console.error("WorkspaceService.updateWorkspace error:", error);
      throw new Error("Failed to update workspace");
    }
  }

  static async deleteWorkspace(id: string): Promise<void> {
    if (!id) throw new Error("Workspace ID is required");
    try {
      await WorkspaceRepository.deleteWorkspace(id);
    } catch (error) {
      console.error("WorkspaceService.deleteWorkspace error:", error);
      throw new Error("Failed to delete workspace");
    }
  }
}
