import { supabase } from "../supabase";

export async function createWorkspace(title: string) {
  const { data, error } = await supabase
    .from("workspaces")
    .insert([
      {
        title,
        status: "draft",
      },
    ])
    .select();

  return { data, error };
}

export async function getWorkspaces() {
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}