import { dbService } from "../lib/services/database/db-service";

async function runTests() {
  console.log("=== Workspace CRUD Tests ===");
  try {
    // 1. Create
    console.log("\n[1] Creating a new workspace...");
    const newWs = await dbService.createWorkspace("Test Workspace", "This is a test workspace");
    console.log("✅ Create Success:", newWs);
    const wsId = newWs.id;

    // 2. Read (Get All)
    console.log("\n[2] Fetching all workspaces...");
    const allWs = await dbService.getWorkspaces();
    const found = allWs.find(w => w.id === wsId);
    if (found) {
      console.log(`✅ Read Success: Found our workspace (${allWs.length} total)`);
    } else {
      throw new Error("Workspace not found after creation!");
    }

    // 3. Update
    console.log("\n[3] Updating workspace...");
    const updated = await dbService.updateWorkspace(wsId, { title: "Updated Title" });
    if (updated?.title === "Updated Title") {
      console.log("✅ Update Success:", updated);
    } else {
      throw new Error("Update failed or returned incorrect data!");
    }

    // 4. Delete
    console.log("\n[4] Deleting workspace...");
    const delSuccess = await dbService.deleteWorkspace(wsId);
    if (delSuccess) {
      const checkWs = await dbService.getWorkspaces();
      if (!checkWs.find(w => w.id === wsId)) {
        console.log("✅ Delete Success: Workspace is gone.");
      } else {
        throw new Error("Workspace still exists after deletion!");
      }
    } else {
      throw new Error("Delete returned false!");
    }

    // 5. Test Failure Cases
    console.log("\n[5] Testing failure cases...");
    
    // 5b. Update non-existent
    console.log("   - Updating non-existent workspace ID 'invalid-id'...");
    const badUpdate = await dbService.updateWorkspace("invalid-id", { title: "Won't Work" });
    if (!badUpdate) {
      console.log("   ✅ Update correctly handled invalid ID (returned null)");
    } else {
      console.log("   ❌ Update unexpected behavior:", badUpdate);
    }

    // 5c. Delete non-existent
    console.log("   - Deleting non-existent workspace ID 'invalid-id'...");
    const badDelete = await dbService.deleteWorkspace("invalid-id");
    console.log("   ✅ Delete response for invalid ID:", badDelete);

    console.log("\n🎉 All tests completed successfully!");

  } catch (error) {
    console.error("\n❌ Test Failed:", error);
  }
}

runTests();
