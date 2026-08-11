import { createClient } from "@/lib/supabase/server";
import { ResearchTopic } from "@/types";

export class TopicRepository {
  static async getTopics(workspaceId: string): Promise<ResearchTopic[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_topics")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getTopicById(id: string): Promise<ResearchTopic> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_topics")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createTopic(topic: Partial<ResearchTopic>): Promise<ResearchTopic> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_topics")
      .insert(topic)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTopic(id: string, updates: Partial<ResearchTopic>): Promise<ResearchTopic> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_topics")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTopic(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("research_topics")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
