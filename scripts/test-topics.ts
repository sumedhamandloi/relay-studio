import { dbService } from "../lib/services/database/db-service";

async function runTests() {
  console.log("=== Topics CRUD Tests ===");
  try {
    // 1. Setup: Need a workspace to hold the topic
    console.log("\n[Setup] Creating a dummy workspace for topics test...");
    const ws = await dbService.createWorkspace("Topic Test Workspace", "Testing topics");
    const wsId = ws.id;

    // 2. Create Topic
    console.log(`\n[1] Creating a new topic in workspace ${wsId}...`);
    const newTopic = await dbService.createTopic(wsId, "Test Topic", "This is a test topic");
    console.log("✅ Create Success:", newTopic);
    const topicId = newTopic.id;

    // 3. Read (Get Topics for Workspace)
    console.log(`\n[2] Fetching topics for workspace ${wsId}...`);
    const allTopics = await dbService.getTopics(wsId);
    const found = allTopics.find(t => t.id === topicId);
    if (found) {
      console.log(`✅ Read Success: Found our topic (${allTopics.length} total in this workspace)`);
    } else {
      throw new Error("Topic not found after creation!");
    }

    // 4. Update Topic
    console.log("\n[3] Updating topic...");
    const updated = await dbService.updateTopic(topicId, { title: "Updated Topic Title" });
    if (updated?.title === "Updated Topic Title") {
      console.log("✅ Update Success:", updated);
    } else {
      throw new Error("Update failed or returned incorrect data!");
    }

    // 5. Delete Topic
    console.log("\n[4] Deleting topic...");
    const delSuccess = await dbService.deleteTopic(topicId);
    if (delSuccess) {
      const checkTopics = await dbService.getTopics(wsId);
      if (!checkTopics.find(t => t.id === topicId)) {
        console.log("✅ Delete Success: Topic is gone.");
      } else {
        throw new Error("Topic still exists after deletion!");
      }
    } else {
      throw new Error("Delete returned false!");
    }

    // 6. Cleanup workspace
    console.log("\n[Cleanup] Deleting test workspace...");
    await dbService.deleteWorkspace(wsId);

    console.log("\n🎉 All Topics tests completed successfully!");

  } catch (error) {
    console.error("\n❌ Test Failed:", error);
  }
}

runTests();
