import { supabase } from "@/lib/supabase/client";
import { Workspace } from "@/types";

export const workspaceRepository = {
  async createWorkspace(data: Partial<Workspace>): Promise<Workspace> {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return workspace;
  },

  async getAllWorkspaces(): Promise<Workspace[]> {
    const { data: workspaces, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return workspaces || [];
  },

  async getWorkspaceById(id: string): Promise<Workspace | null> {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(error.message);
    }
    return workspace;
  },

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return workspace;
  },

  async deleteWorkspace(id: string): Promise<void> {
    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
