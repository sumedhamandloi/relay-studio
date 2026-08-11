import { dbService } from "../lib/services/database/db-service";

async function runTests() {
  console.log("=== References CRUD Tests ===");
  try {
    // 1. Setup
    console.log("\n[Setup] Creating a dummy workspace and topic...");
    const ws = await dbService.createWorkspace("Ref Test Workspace", "Testing refs");
    const topic = await dbService.createTopic(ws.id, "Ref Test Topic", "Testing refs topic");
    const topicId = topic.id;

    // 2. Create Reference
    console.log(`\n[1] Creating a new reference in topic ${topicId}...`);
    const newRef = await dbService.addReference(topicId, "Test YouTube Video", "https://youtube.com/watch?v=123", "youtube", "raw transcript text here");
    console.log("✅ Create Success:", newRef);
    const refId = newRef.id;

    // 3. Read (Get References for Topic)
    console.log(`\n[2] Fetching references for topic ${topicId}...`);
    const allRefs = await dbService.getReferences(topicId);
    const found = allRefs.find(r => r.id === refId);
    if (found) {
      console.log(`✅ Read Success: Found our reference (${allRefs.length} total)`);
    } else {
      throw new Error("Reference not found after creation!");
    }

    // 4. Update Reference
    console.log("\n[3] Updating reference...");
    const updated = await dbService.updateReference(refId, { title: "Updated Ref Title", summary: "New summary" });
    if (updated?.title === "Updated Ref Title") {
      console.log("✅ Update Success:", updated);
    } else {
      throw new Error("Update failed or returned incorrect data!");
    }

    // 5. Delete Reference
    console.log("\n[4] Deleting reference...");
    const delSuccess = await dbService.deleteReference(refId);
    if (delSuccess) {
      const checkRefs = await dbService.getReferences(topicId);
      if (!checkRefs.find(r => r.id === refId)) {
        console.log("✅ Delete Success: Reference is gone.");
      } else {
        throw new Error("Reference still exists after deletion!");
      }
    } else {
      throw new Error("Delete returned false!");
    }

    // 6. Cleanup
    console.log("\n[Cleanup] Deleting test workspace...");
    await dbService.deleteWorkspace(ws.id);

    console.log("\n🎉 All References tests completed successfully!");

  } catch (error) {
    console.error("\n❌ Test Failed:", error);
  }
}

runTests();
