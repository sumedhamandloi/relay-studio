async function testAPI() {
  const baseUrl = "http://localhost:3000/api/workspaces";
  let output = "# API Test Results\n\n";
  let createdId = "";

  // 1. Create - Happy Path
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test Workspace", description: "Integration test" })
    });
    const data = await res.json();
    output += `## 1. Create (Happy Path)\n- Status: ${res.status}\n- Response: ${JSON.stringify(data)}\n\n`;
    if (res.ok) createdId = data.id;
  } catch (e) {
    output += `## 1. Create (Happy Path)\n- Error: ${e.message}\n\n`;
  }

  // 1b. Create - Failure Case (Missing Title)
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Missing title" })
    });
    const data = await res.json();
    output += `## 2. Create (Failure - Missing Title)\n- Status: ${res.status} (Expected 400)\n- Response: ${JSON.stringify(data)}\n\n`;
  } catch (e) {
    output += `## 2. Create (Failure)\n- Error: ${e.message}\n\n`;
  }

  // 2. Read All - Happy Path
  try {
    const res = await fetch(baseUrl);
    const data = await res.json();
    output += `## 3. Read All (Happy Path)\n- Status: ${res.status}\n- Response Count: ${data.length}\n\n`;
  } catch (e) {
    output += `## 3. Read All (Happy Path)\n- Error: ${e.message}\n\n`;
  }

  // 2b. Read One - Failure Case (Invalid ID)
  try {
    // A non-UUID format ID
    const res = await fetch(`${baseUrl}/invalid-id`);
    const data = await res.json();
    output += `## 4. Read One (Failure - Invalid ID)\n- Status: ${res.status} (Expected 500/404/400)\n- Response: ${JSON.stringify(data)}\n\n`;
  } catch (e) {
    output += `## 4. Read One (Failure)\n- Error: ${e.message}\n\n`;
  }

  // 3. Update - Happy Path
  if (createdId) {
    try {
      const res = await fetch(`${baseUrl}/${createdId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Workspace Title" })
      });
      const data = await res.json();
      output += `## 5. Update (Happy Path)\n- Status: ${res.status}\n- Response: ${JSON.stringify(data)}\n\n`;
    } catch (e) {
      output += `## 5. Update (Happy Path)\n- Error: ${e.message}\n\n`;
    }
  }

  // 4. Delete - Happy Path
  if (createdId) {
    try {
      const res = await fetch(`${baseUrl}/${createdId}`, { method: "DELETE" });
      output += `## 6. Delete (Happy Path)\n- Status: ${res.status} (Expected 204)\n\n`;
    } catch (e) {
      output += `## 6. Delete (Happy Path)\n- Error: ${e.message}\n\n`;
    }
  }

  // 4b. Delete - Failure Case (Not Found / Already Deleted)
  if (createdId) {
    try {
      const res = await fetch(`${baseUrl}/${createdId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      output += `## 7. Delete (Failure - Not Found)\n- Status: ${res.status}\n- Response: ${data ? JSON.stringify(data) : "No body"}\n\n`;
    } catch (e) {
      output += `## 7. Delete (Failure)\n- Error: ${e.message}\n\n`;
    }
  }

  console.log(output);
}

testAPI();
