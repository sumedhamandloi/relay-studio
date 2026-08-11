import { createClient } from "@/lib/supabase/server";
import { Reference } from "@/types";

export class ReferenceRepository {
  static async getReferences(topicId: string): Promise<Reference[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_references")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    // Map db schema to app schema
    return (data || []).map((d: any) => ({
      ...d,
      type: d.source_type,
      summary: d.notes
    }));
  }

  static async getReferenceById(id: string): Promise<Reference> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_references")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return {
      ...data,
      type: data.source_type,
      summary: data.notes
    };
  }

  static async createReference(reference: any): Promise<Reference> {
    const supabase = await createClient();
    // Map app schema to db schema
    const dbRef = { ...reference };
    if (dbRef.type !== undefined) {
      dbRef.source_type = dbRef.type;
      delete dbRef.type;
    }
    if (dbRef.summary !== undefined) {
      dbRef.notes = dbRef.summary;
      delete dbRef.summary;
    }

    const { data, error } = await supabase
      .from("research_references")
      .insert(dbRef)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      type: data.source_type,
      summary: data.notes
    };
  }

  static async updateReference(id: string, updates: any): Promise<Reference> {
    const supabase = await createClient();
    const dbUpdates = { ...updates };
    if (dbUpdates.type !== undefined) {
      dbUpdates.source_type = dbUpdates.type;
      delete dbUpdates.type;
    }
    if (dbUpdates.summary !== undefined) {
      dbUpdates.notes = dbUpdates.summary;
      delete dbUpdates.summary;
    }

    const { data, error } = await supabase
      .from("research_references")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      type: data.source_type,
      summary: data.notes
    };
  }

  static async deleteReference(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("research_references")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
