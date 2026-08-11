import {
  topicRepository,
  CreateTopicDTO,
} from "@/repositories/topic.repository";

class TopicService {
  async getTopics(workspaceId: string) {
    return topicRepository.getAll(workspaceId);
  }

  async getTopic(id: string) {
    return topicRepository.getById(id);
  }

  async createTopic(topic: CreateTopicDTO) {
    if (!topic.title.trim()) {
      throw new Error("Topic title is required.");
    }

    if (!topic.workspace_id) {
      throw new Error("Workspace ID is required.");
    }

    return topicRepository.create(topic);
  }

  async updateTopic(
    id: string,
    updates: Partial<CreateTopicDTO>
  ) {
    return topicRepository.update(id, updates);
  }

  async deleteTopic(id: string) {
    return topicRepository.delete(id);
  }
}

export const topicService = new TopicService();