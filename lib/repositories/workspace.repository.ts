import { createClient } from "@/lib/supabase/server";
import { Workspace } from "@/types";

export class WorkspaceRepository {
  static async getWorkspaces(): Promise<Workspace[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getWorkspaceById(id: string): Promise<Workspace> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createWorkspace(workspace: Partial<Workspace>): Promise<Workspace> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workspaces")
      .insert(workspace)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("workspaces")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWorkspace(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
