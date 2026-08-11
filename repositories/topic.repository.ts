import { supabase } from "@/lib/supabase/client";

export interface CreateTopicDTO {
  workspace_id: string;
  title: string;
  status?: string;
}

export class TopicRepository {
  async getAll(workspaceId: string) {
    const { data, error } = await supabase
      .from("research_topics")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data;
  }

  async getById(id: string) {
    const { data, error } = await supabase
      .from("research_topics")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  }

  async create(topic: CreateTopicDTO) {
    const { data, error } = await supabase
      .from("research_topics")
      .insert({
        workspace_id: topic.workspace_id,
        title: topic.title,
        status: topic.status ?? "draft",
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async update(
    id: string,
    updates: Partial<CreateTopicDTO>
  ) {
    const { data, error } = await supabase
      .from("research_topics")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from("research_topics")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return true;
  }
}

export const topicRepository = new TopicRepository();