import { workspaceRepository } from "@/repositories/workspace.repository";
import { Workspace } from "@/types";

export const workspaceService = {
  async createWorkspace(data: Partial<Workspace>): Promise<Workspace> {
    if (!data.title || data.title.trim() === "") {
      throw new Error("Workspace title cannot be empty");
    }
    if (!data.user_id) {
      throw new Error("User ID is required to create a workspace");
    }

    const cleanData = {
      ...data,
      title: data.title.trim(),
      description: data.description?.trim(),
    };

    return await workspaceRepository.createWorkspace(cleanData);
  },

  async getAllWorkspaces(): Promise<Workspace[]> {
    return await workspaceRepository.getAllWorkspaces();
  },

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    if (!id) throw new Error("Workspace ID is required");
    return await workspaceRepository.getWorkspaceById(id);
  },

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    if (!id) throw new Error("Workspace ID is required");

    const cleanData = { ...data };
    
    if (data.title !== undefined) {
      if (data.title.trim() === "") {
        throw new Error("Workspace title cannot be empty");
      }
      cleanData.title = data.title.trim();
    }
    
    if (data.description !== undefined) {
      cleanData.description = data.description.trim();
    }

    return await workspaceRepository.updateWorkspace(id, cleanData);
  },

  async deleteWorkspace(id: string): Promise<void> {
    if (!id) throw new Error("Workspace ID is required");
    await workspaceRepository.deleteWorkspace(id);
  }
};
