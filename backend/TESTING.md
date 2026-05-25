# DevDuel Backend - API Testing Guide

## Quick Start

### Start the Server

```bash
cd backend
npm start
```

The server will start at `http://localhost:5000`

## Testing with cURL

### 1. Health Check

```bash
curl http://localhost:5000
```

**Response:**

```json
{
  "status": "ok",
  "service": "DevDuel Backend",
  "version": "1.0.0",
  "timestamp": "2026-05-18T08:00:00.000Z"
}
```

### 2. Create a New Room

```bash
curl -X POST http://localhost:5000/api/rooms/create
```

**Response:**

```json
{
  "success": true,
  "roomId": "room_abc123",
  "message": "Room created: room_abc123",
  "shareUrl": "http://localhost:5000/duel/room_abc123"
}
```

### 3. Get Room State

```bash
curl http://localhost:5000/api/rooms/room_abc123
```

**Response:**

```json
{
  "success": true,
  "room": {
    "roomId": "room_abc123",
    "currentPhase": "LOBBY",
    "players": {
      "alpha": { "socketId": null, "username": "", "status": "IDLE", "branchContent": "" },
      "beta": { "socketId": null, "username": "", "status": "IDLE", "branchContent": "" }
    },
    "repository": { ... },
    "activeConflicts": [],
    "liveResolvedCode": ""
  }
}
```

### 4. List All Rooms

```bash
curl http://localhost:5000/api/rooms
```

**Response:**

```json
{
  "success": true,
  "activeRooms": 5,
  "rooms": {
    "room_abc123": {
      "roomId": "room_abc123",
      "phase": "EDIT_PHASE",
      "playersCount": 2,
      "createdAt": 1716028800000
    }
  }
}
```

### 5. Get Server Statistics

```bash
curl http://localhost:5000/api/stats
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "activeRooms": 5,
    "connectedSockets": 10,
    "timestamp": "2026-05-18T08:00:00.000Z"
  }
}
```

### 6. Delete a Room

```bash
curl -X DELETE http://localhost:5000/api/rooms/room_abc123
```

**Response:**

```json
{
  "success": true,
  "message": "Room room_abc123 deleted"
}
```

## Testing with WebSocket (Node.js Client)

### Setup

```javascript
const io = require("socket.io-client");
const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to server");

  // Now test socket events
});
```

### Test 1: Join a Room

```javascript
socket.emit(
  "JOIN_DUEL_ROOM",
  {
    roomId: "room_abc123",
    username: "Developer Alpha",
  },
  (response) => {
    console.log("Join response:", response);
    // response.success
    // response.slot ('alpha' or 'beta')
    // response.roomState (full room object)
  },
);
```

### Test 2: Start Edit Phase

```javascript
socket.emit("START_EDIT_PHASE", {}, (response) => {
  console.log("Edit phase started:", response);
});

// Listen for room transition
socket.on("ROOM_STATE_TRANSITION", (data) => {
  console.log("Room transitioned to:", data.phase);
  console.log("Payload:", data.payload);
});
```

### Test 3: Submit Branch Commit

```javascript
socket.emit(
  "SUBMIT_BRANCH_COMMIT",
  {
    content: `function myFunction() {
  console.log('Modified code from Developer Alpha');
  return true;
}`,
  },
  (response) => {
    console.log("Commit response:", response);
    if (response.bothCommitted) {
      console.log("Both developers committed! Conflicts generated!");
    }
  },
);

// Listen for conflict generation
socket.on("ROOM_STATE_TRANSITION", (data) => {
  if (data.phase === "CONFLICT_MODE") {
    console.log("Conflict file:", data.conflict);
  }
});
```

### Test 4: Synchronize Workspace Edit

```javascript
socket.emit(
  "SYNC_WORKSPACE_EDIT",
  {
    fullText: `// Resolved code
function myFunction() {
  console.log('Merged changes from both developers');
  return true;
}`,
  },
  (response) => {
    console.log("Workspace updated:", response);
  },
);

// Listen for peer updates
socket.on("WORKSPACE_UPDATED", (data) => {
  console.log("Peer updated the workspace:");
  console.log("Updated by:", data.updatedBy);
  console.log("Content:", data.fullText);
});
```

### Test 5: Update Cursor Position

```javascript
socket.emit(
  "CURSOR_POSITION_MOVE",
  {
    line: 5,
    ch: 10,
  },
  (response) => {
    console.log("Cursor position sent");
  },
);

// Listen for peer cursor updates
socket.on("PEER_CURSOR_UPDATED", (data) => {
  console.log("Peer cursor at:", data.line, data.ch);
  console.log("Updated by:", data.username);
});
```

### Test 6: Request Merge Verification

```javascript
socket.emit("REQUEST_MERGE_VERIFICATION", {}, (response) => {
  console.log("Verification response:", response);
  if (response.success) {
    console.log("✅ Merge successful!");
    console.log("Verification results:", response.verificationResult);
  } else {
    console.log("❌ Merge failed");
    console.log("Errors:", response.verificationResult.errors);
  }
});

// Listen for verification results
socket.on("ROOM_STATE_TRANSITION", (data) => {
  if (data.phase === "SUCCESS_SCREEN") {
    console.log("Merge complete! Moving to success screen");
  }
});
```

### Test 7: Get Room State

```javascript
socket.emit("GET_ROOM_STATE", {}, (response) => {
  console.log("Current room state:", response.roomState);
});
```

## Complete End-to-End Test Script

```javascript
const io = require("socket.io-client");

async function testDevDuel() {
  const alphaSocket = io("http://localhost:5000");
  const betaSocket = io("http://localhost:5000");

  // Wait for connections
  await new Promise((resolve) => {
    let connected = 0;
    alphaSocket.on("connect", () => {
      if (++connected === 2) resolve();
    });
    betaSocket.on("connect", () => {
      if (++connected === 2) resolve();
    });
  });

  console.log("✅ Both sockets connected");

  // Test: Create room (via HTTP first)
  const roomRes = await fetch("http://localhost:5000/api/rooms/create", {
    method: "POST",
  }).then((r) => r.json());

  const roomId = roomRes.roomId;
  console.log("✅ Room created:", roomId);

  // Test: Both players join
  await new Promise((resolve) => {
    alphaSocket.emit(
      "JOIN_DUEL_ROOM",
      {
        roomId,
        username: "Alpha",
      },
      (res) => {
        console.log("✅ Alpha joined as", res.slot);
        betaSocket.emit(
          "JOIN_DUEL_ROOM",
          {
            roomId,
            username: "Beta",
          },
          (res) => {
            console.log("✅ Beta joined as", res.slot);
            resolve();
          },
        );
      },
    );
  });

  // Test: Start edit phase
  await new Promise((resolve) => {
    alphaSocket.emit("START_EDIT_PHASE", {}, (res) => {
      console.log("✅ Edit phase started");
      resolve();
    });
  });

  // Test: Alpha commits first change
  await new Promise((resolve) => {
    alphaSocket.emit(
      "SUBMIT_BRANCH_COMMIT",
      {
        content: 'function alphaFunction() { return "alpha"; }',
      },
      (res) => {
        console.log("✅ Alpha committed");
        // Beta commits different change
        betaSocket.emit(
          "SUBMIT_BRANCH_COMMIT",
          {
            content: 'function betaFunction() { return "beta"; }',
          },
          (res) => {
            console.log("✅ Beta committed - conflicts generated!");
            resolve();
          },
        );
      },
    );
  });

  // Listen for conflict
  await new Promise((resolve) => {
    alphaSocket.on("ROOM_STATE_TRANSITION", (data) => {
      if (data.phase === "CONFLICT_MODE") {
        console.log("✅ In conflict mode");
        resolve();
      }
    });
  });

  // Test: Sync workspace edit
  await new Promise((resolve) => {
    alphaSocket.emit(
      "SYNC_WORKSPACE_EDIT",
      {
        fullText: 'function merged() { return "both"; }',
      },
      () => {
        console.log("✅ Workspace synchronized");
        resolve();
      },
    );
  });

  // Test: Request verification
  await new Promise((resolve) => {
    alphaSocket.emit("REQUEST_MERGE_VERIFICATION", {}, (res) => {
      if (res.success) {
        console.log("✅ Verification passed!");
        console.log(
          "   Passed checks:",
          res.verificationResult.passedChecks,
          "/",
          res.verificationResult.totalChecks,
        );
      } else {
        console.log("❌ Verification failed");
        console.log("   Errors:", res.verificationResult.errors);
      }
      resolve();
    });
  });

  // Cleanup
  alphaSocket.disconnect();
  betaSocket.disconnect();
  console.log("✅ Test complete!");
}

testDevDuel().catch(console.error);
```

## Error Handling Tests

### Test Invalid Room ID

```javascript
socket.emit(
  "JOIN_DUEL_ROOM",
  {
    roomId: "invalid_room",
    username: "Test User",
  },
  (response) => {
    console.log(response); // { success: false, error: 'Room not found' }
  },
);
```

### Test Missing Parameters

```javascript
socket.emit(
  "JOIN_DUEL_ROOM",
  {
    roomId: "room_abc123",
    // Missing username
  },
  (response) => {
    console.log(response); // { success: false, error: 'Missing roomId or username' }
  },
);
```

### Test Room Full

```javascript
// After 2 players have joined
socket3.emit(
  "JOIN_DUEL_ROOM",
  {
    roomId: "room_abc123",
    username: "Third Player",
  },
  (response) => {
    console.log(response); // { success: false, error: 'Room is full' }
  },
);
```

## Performance Testing

### Load Test: Create Multiple Rooms

```javascript
async function loadTest() {
  for (let i = 0; i < 100; i++) {
    const res = await fetch("http://localhost:5000/api/rooms/create", {
      method: "POST",
    }).then((r) => r.json());

    if (res.success) {
      console.log(`Created room ${i}: ${res.roomId}`);
    }
  }

  // Check stats
  const stats = await fetch("http://localhost:5000/api/stats").then((r) =>
    r.json(),
  );
  console.log("Total active rooms:", stats.stats.activeRooms);
}

loadTest();
```

## Debugging Tips

1. **Monitor all events**:

```javascript
socket.onAny((eventName, ...args) => {
  console.log(`[${eventName}]`, args);
});
```

2. **Enable Socket.io debug**:

```javascript
const socket = io("http://localhost:5000", {
  transportOptions: {
    polling: {
      extraHeaders: {
        "X-Custom-Header": "value",
      },
    },
  },
});
```

3. **Check server logs**: The server prints all events to console with timestamps

4. **Monitor network traffic**: Use browser DevTools or Postman for HTTP requests
