import { ReferenceRepository } from "@/lib/repositories/reference.repository";
import { Reference } from "@/types";

export class ReferenceService {
  static async getReferences(topicId: string): Promise<Reference[]> {
    if (!topicId) throw new Error("Topic ID is required");
    try {
      return await ReferenceRepository.getReferences(topicId);
    } catch (error) {
      console.error("ReferenceService.getReferences error:", error);
      throw new Error("Failed to fetch references");
    }
  }

  static async getReferenceById(id: string): Promise<Reference> {
    if (!id) throw new Error("Reference ID is required");
    try {
      return await ReferenceRepository.getReferenceById(id);
    } catch (error) {
      console.error("ReferenceService.getReferenceById error:", error);
      throw new Error("Failed to fetch reference");
    }
  }

  static async createReference(topicId: string, referenceData: Partial<Reference>): Promise<Reference> {
    if (!topicId) throw new Error("Topic ID is required");
    if (!referenceData.title || referenceData.title.trim() === "") throw new Error("Reference title is required");

    const ref = {
      topic_id: topicId,
      ...referenceData
    };

    try {
      return await ReferenceRepository.createReference(ref);
    } catch (error) {
      console.error("ReferenceService.createReference error:", error);
      throw new Error("Failed to create reference");
    }
  }

  static async updateReference(id: string, updates: Partial<Reference>): Promise<Reference> {
    if (!id) throw new Error("Reference ID is required");
    
    // updated_at is omitted intentionally for reference as per prior live schema findings
    const safeUpdates = { ...updates };
    delete safeUpdates.id;

    try {
      return await ReferenceRepository.updateReference(id, safeUpdates);
    } catch (error) {
      console.error("ReferenceService.updateReference error:", error);
      throw new Error("Failed to update reference");
    }
  }

  static async deleteReference(id: string): Promise<void> {
    if (!id) throw new Error("Reference ID is required");
    try {
      await ReferenceRepository.deleteReference(id);
    } catch (error) {
      console.error("ReferenceService.deleteReference error:", error);
      throw new Error("Failed to delete reference");
    }
  }
}
