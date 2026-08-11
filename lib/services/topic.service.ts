import { TopicRepository } from "@/lib/repositories/topic.repository";
import { ResearchTopic } from "@/types";

export class TopicService {
  static async getTopics(workspaceId: string): Promise<ResearchTopic[]> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    try {
      return await TopicRepository.getTopics(workspaceId);
    } catch (error) {
      console.error("TopicService.getTopics error:", error);
      throw new Error("Failed to fetch topics");
    }
  }

  static async getTopicById(id: string): Promise<ResearchTopic> {
    if (!id) throw new Error("Topic ID is required");
    try {
      return await TopicRepository.getTopicById(id);
    } catch (error) {
      console.error("TopicService.getTopicById error:", error);
      throw new Error("Failed to fetch topic");
    }
  }

  static async createTopic(workspaceId: string, title: string, description?: string): Promise<ResearchTopic> {
    if (!workspaceId) throw new Error("Workspace ID is required");
    if (!title || title.trim() === "") throw new Error("Topic title is required");

    const topic = {
      workspace_id: workspaceId,
      title,
      description: description || "",
      status: "draft" as const
    };

    try {
      return await TopicRepository.createTopic(topic);
    } catch (error) {
      console.error("TopicService.createTopic error:", error);
      throw new Error("Failed to create topic");
    }
  }

  static async updateTopic(id: string, updates: Partial<ResearchTopic>): Promise<ResearchTopic> {
    if (!id) throw new Error("Topic ID is required");
    
    const safeUpdates = { ...updates, updated_at: new Date().toISOString() };
    delete safeUpdates.id;

    try {
      return await TopicRepository.updateTopic(id, safeUpdates);
    } catch (error) {
      console.error("TopicService.updateTopic error:", error);
      throw new Error("Failed to update topic");
    }
  }

  static async deleteTopic(id: string): Promise<void> {
    if (!id) throw new Error("Topic ID is required");
    try {
      await TopicRepository.deleteTopic(id);
    } catch (error) {
      console.error("TopicService.deleteTopic error:", error);
      throw new Error("Failed to delete topic");
    }
  }
}
