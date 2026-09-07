import { createClient } from "@/lib/supabase/server";
import { Workspace } from "@/types";

export class WorkspaceRepository {
  static async getWorkspaces(): Promise<Workspace[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If unauthenticated or no user session, return empty list (never expose other users' workspaces)
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getWorkspaceById(id: string): Promise<Workspace> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createWorkspace(workspace: Partial<Workspace>): Promise<Workspace> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized: You must be logged in to create a workspace");
    }

    // Auto-sync profile to public.users table to satisfy fk_workspaces_user constraint
    try {
      await supabase.from("users").upsert({
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Creator"
      }, { onConflict: "id" });
    } catch (uErr) {
      console.warn("Could not auto-sync user into public.users:", uErr);
    }

    const workspaceData = {
      ...workspace,
      user_id: user.id
    };

    const { data, error } = await supabase
      .from("workspaces")
      .insert(workspaceData)
      .select()
      .single();

    if (error) {
      console.error("Supabase createWorkspace error:", error);
      throw error;
    }
    return data;
  }

  static async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
      .from("workspaces")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWorkspace(id: string): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
  }
}
