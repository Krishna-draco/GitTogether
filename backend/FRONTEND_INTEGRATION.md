# DevDuel Backend - Frontend Integration Quick Reference

## Connection Setup

### Install Socket.io Client

```bash
npm install socket.io-client
```

### Initialize Connection

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

socket.on("connect", () => {
  console.log("Connected to DevDuel backend");
});
```

---

## Event Flow Sequence

### Complete Game Flow

```
1. CREATE ROOM (Frontend)
   └─ POST /api/rooms/create
   └─ Response: { roomId, shareUrl }

2. LOBBY PHASE
   ├─ Player A: JOIN_DUEL_ROOM ({ roomId, username: 'Alpha' })
   ├─ Server: Broadcasts ROOM_UPDATED
   ├─ Player B: JOIN_DUEL_ROOM ({ roomId, username: 'Beta' })
   ├─ Server: Broadcasts BOTH_PLAYERS_READY
   └─ Both ready to start

3. EDIT PHASE
   ├─ Either player: START_EDIT_PHASE ()
   ├─ Server: Broadcasts ROOM_STATE_TRANSITION
   ├─ Player A: Edits code locally
   ├─ Player B: Edits code locally
   ├─ Player A: SUBMIT_BRANCH_COMMIT ({ content })
   ├─ Player B: SUBMIT_BRANCH_COMMIT ({ content })
   └─ Server: Broadcasts ROOM_STATE_TRANSITION to CONFLICT_MODE

4. CONFLICT MODE
   ├─ Both: Receive WORKSPACE_UPDATED with conflict markers
   ├─ Both: Real-time editing via SYNC_WORKSPACE_EDIT
   ├─ Both: Cursor tracking via CURSOR_POSITION_MOVE
   ├─ Either: REQUEST_MERGE_VERIFICATION ()
   └─ Server: Broadcasts ROOM_STATE_TRANSITION to SUCCESS_SCREEN

5. SUCCESS
   ├─ Both: See SUCCESS_SCREEN with merged code
   └─ Room: Ready for next session or cleanup
```

---

## Event Handler Setup

### Global Event Listeners

```javascript
// Setup once after connection
socket.on("ROOM_UPDATED", (data) => {
  console.log("Room state updated:", data.roomState);
  updateUIPlayerList(data.roomState.players);
});

socket.on("ROOM_STATE_TRANSITION", (data) => {
  console.log("Phase changed to:", data.phase);
  updateUIPhase(data.phase);

  if (data.phase === "CONFLICT_MODE") {
    displayConflictFile(data.conflict);
  }
  if (data.phase === "SUCCESS_SCREEN") {
    displaySuccessScreen(data.payload);
  }
});

socket.on("BOTH_PLAYERS_READY", (data) => {
  console.log(data.message);
  enableStartButton();
});

socket.on("WORKSPACE_UPDATED", (data) => {
  console.log("Peer updated:", data.updatedBy);
  updateEditorContent(data.fullText);
});

socket.on("PEER_CURSOR_UPDATED", (data) => {
  renderPeerCursor(data.username, data.line, data.ch);
});

socket.on("VERIFICATION_RESULT", (data) => {
  if (data.success) {
    console.log("✅ Verification passed!");
  } else {
    console.log("❌ Verification failed:", data.errors);
    displayErrors(data.details);
  }
});

socket.on("disconnect", () => {
  console.log("Disconnected from backend");
  showReconnectingMessage();
});
```

---

## Frontend Functions to Implement

### 1. Room Creation

```javascript
async function createAndJoinRoom(username) {
  try {
    // Create room
    const roomRes = await fetch("http://localhost:5000/api/rooms/create", {
      method: "POST",
    }).then((r) => r.json());

    const roomId = roomRes.roomId;

    // Join room
    socket.emit(
      "JOIN_DUEL_ROOM",
      {
        roomId,
        username,
      },
      (response) => {
        if (response.success) {
          console.log("Joined as:", response.slot);
          displayShareURL(roomRes.shareUrl);
          updateRoomUI(response.roomState);
        }
      },
    );
  } catch (error) {
    console.error("Failed to create room:", error);
  }
}
```

### 2. Join Existing Room

```javascript
function joinExistingRoom(roomId, username) {
  socket.emit(
    "JOIN_DUEL_ROOM",
    {
      roomId,
      username,
    },
    (response) => {
      if (response.success) {
        console.log("Successfully joined room");
        updateRoomUI(response.roomState);
      } else {
        showError(response.error);
      }
    },
  );
}
```

### 3. Start Edit Phase

```javascript
function startEditPhase() {
  socket.emit("START_EDIT_PHASE", {}, (response) => {
    if (response.success) {
      console.log("Edit phase started");
      displayInitialCode(response.roomState);
    }
  });
}
```

### 4. Commit Branch Changes

```javascript
function commitBranch(code) {
  socket.emit(
    "SUBMIT_BRANCH_COMMIT",
    {
      content: code,
    },
    (response) => {
      if (response.success) {
        if (response.bothCommitted) {
          console.log("Both committed - conflicts generated!");
        } else {
          console.log("Waiting for peer to commit...");
        }
      }
    },
  );
}
```

### 5. Sync Editor Changes (Real-time)

```javascript
function syncEditorChange(fullText) {
  socket.emit(
    "SYNC_WORKSPACE_EDIT",
    {
      fullText,
    },
    (response) => {
      if (!response.success) {
        console.error("Failed to sync:", response.error);
      }
    },
  );
}

// Call this on editor change
editor.onDidChangeModelContent(() => {
  const content = editor.getValue();
  syncEditorChange(content);
});
```

### 6. Send Cursor Position

```javascript
function sendCursorPosition(line, ch) {
  socket.emit("CURSOR_POSITION_MOVE", {
    line,
    ch,
  });
}

// Example: Monaco Editor cursor tracking
editor.onDidChangeCursorPosition((e) => {
  sendCursorPosition(e.position.lineNumber, e.position.column);
});
```

### 7. Request Verification

```javascript
function requestMergeVerification() {
  socket.emit("REQUEST_MERGE_VERIFICATION", {}, (response) => {
    if (response.success) {
      console.log("✅ Merge successful!");
      displayMergeResult("success", response.verificationResult);
    } else {
      console.log("❌ Verification failed");
      displayMergeResult("failed", response.verificationResult);
    }
  });
}
```

### 8. Get Current Room State

```javascript
function getRoomState() {
  socket.emit("GET_ROOM_STATE", {}, (response) => {
    if (response.success) {
      return response.roomState;
    }
  });
}
```

---

## UI State Management

### Phase-Based UI Updates

```javascript
const phaseUIMap = {
  LOBBY: {
    show: ["playerList", "waitingMessage"],
    hide: ["editor", "conflictDisplay", "successScreen"],
    enabled: ["startButton"],
  },
  EDIT_PHASE: {
    show: ["editor", "playerList"],
    hide: ["conflictDisplay", "successScreen"],
    enabled: ["commitButton"],
  },
  CONFLICT_MODE: {
    show: ["conflictDisplay", "sharedEditor", "cursorIndicators"],
    hide: ["successScreen"],
    enabled: ["verifyButton"],
  },
  SUCCESS_SCREEN: {
    show: ["successScreen", "mergedCode"],
    hide: ["editor", "conflictDisplay"],
    enabled: ["newGameButton"],
  },
};

function updateUIPhase(phase) {
  const uiConfig = phaseUIMap[phase];

  uiConfig.show.forEach((id) => {
    document.getElementById(id).style.display = "block";
  });

  uiConfig.hide.forEach((id) => {
    document.getElementById(id).style.display = "none";
  });

  uiConfig.enabled.forEach((id) => {
    document.getElementById(id).disabled = false;
  });
}
```

---

## Conflict Display

### Render Conflict Markers

```javascript
function displayConflictFile(conflictFile) {
  const { filename, mergedWithMarkers, conflictSections } = conflictFile;

  // Set editor content
  editor.setValue(mergedWithMarkers);

  // Highlight conflict sections
  conflictSections.forEach((section) => {
    highlightConflictRange(
      section.startLine,
      section.endLine,
      "conflict-marker",
    );
  });
}
```

### Conflict Marker Highlighting

```javascript
function highlightConflictRange(startLine, endLine, className) {
  const range = new monaco.Range(startLine, 1, endLine, 1);
  editor.deltaDecorations(
    [],
    [
      {
        range: range,
        options: {
          isWholeLine: true,
          className: className,
          glyphMarginClassName: "conflict-glyph",
        },
      },
    ],
  );
}
```

---

## Error Handling

### Common Error Scenarios

```javascript
const errorHandlers = {
  "Room not found": () => showError("Invalid room ID"),
  "Room is full": () => showError("This room is already full"),
  "Both players must be present": () => showError("Waiting for other player"),
  "Not in conflict resolution mode": () => showError("Not in conflict mode"),
  "Unresolved conflict markers": () => {
    showError("Remove all conflict markers before verifying");
    highlightConflictMarkers();
  },
  "Syntax Error": () => showError("Code contains syntax errors"),
};

socket.on("VERIFICATION_RESULT", (data) => {
  if (!data.success) {
    data.errors.forEach((error) => {
      const handler = errorHandlers[error];
      if (handler) handler();
      else showError(error);
    });
  }
});
```

---

## Cursor Presence Indicators

### Render Remote Cursor

```javascript
const remoteCursors = new Map();

socket.on("PEER_CURSOR_UPDATED", (data) => {
  const { username, playerSlot, line, ch } = data;

  let cursor = remoteCursors.get(username);

  if (!cursor) {
    cursor = createCursorElement(username, playerSlot);
    remoteCursors.set(username, cursor);
  }

  // Get position in pixel coordinates
  const coords = editor.getTopForLineNumber(line);
  cursor.style.top = coords + "px";
  cursor.style.left = ch * 8 + "px"; // Approximate char width
});

function createCursorElement(username, playerSlot) {
  const cursor = document.createElement("div");
  cursor.className = `remote-cursor ${playerSlot}`;
  cursor.innerHTML = `
    <div class="cursor-line"></div>
    <div class="cursor-label">${username}</div>
  `;
  document.getElementById("editorContainer").appendChild(cursor);
  return cursor;
}
```

---

## Session Recovery

### Handle Disconnection & Reconnection

```javascript
socket.on("disconnect", () => {
  currentRoomId = null;
  showDisconnectMessage();
  disableAllButtons();
});

socket.on("connect", () => {
  if (currentRoomId) {
    console.log("Reconnecting to room...");
    rejoinRoom(currentRoomId, currentUsername);
  }
});

function rejoinRoom(roomId, username) {
  socket.emit(
    "JOIN_DUEL_ROOM",
    {
      roomId,
      username,
    },
    (response) => {
      if (response.success) {
        console.log("Rejoined room successfully");
        updateRoomUI(response.roomState);

        // If in conflict mode, restore editor content
        if (response.roomState.currentPhase === "CONFLICT_MODE") {
          editor.setValue(response.roomState.liveResolvedCode);
        }
      }
    },
  );
}
```

---

## Example Component (React)

```javascript
import React, { useEffect, useState } from "react";
import io from "socket.io-client";

export function DevDuelGame() {
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [editorContent, setEditorContent] = useState("");

  useEffect(() => {
    const sock = io("http://localhost:5000");

    sock.on("ROOM_STATE_TRANSITION", (data) => {
      setRoomState(data.payload);
    });

    sock.on("WORKSPACE_UPDATED", (data) => {
      setEditorContent(data.fullText);
    });

    setSocket(sock);

    return () => sock.disconnect();
  }, []);

  return (
    <div>
      <h1>DevDuel</h1>
      {roomState && (
        <>
          <p>Phase: {roomState.currentPhase}</p>
          <textarea
            value={editorContent}
            onChange={(e) => {
              setEditorContent(e.target.value);
              socket?.emit("SYNC_WORKSPACE_EDIT", {
                fullText: e.target.value,
              });
            }}
          />
        </>
      )}
    </div>
  );
}
```

---

## API Response Formats

### Callback Responses

```javascript
// Success response
{
  success: true,
  slot: 'alpha',
  roomState: { /* DuelRoom object */ }
}

// Error response
{
  success: false,
  error: 'Room not found'
}
```

### Event Payloads

```javascript
// ROOM_STATE_TRANSITION
{
  phase: 'CONFLICT_MODE',
  payload: { /* DuelRoom object */ },
  conflict: { /* ConflictFile object */ },
  message: 'Conflicts detected!'
}

// WORKSPACE_UPDATED
{
  fullText: '...code...',
  updatedBy: 'alpha',
  timestamp: 1716028800000
}

// VERIFICATION_RESULT
{
  success: true,
  errors: [],
  details: [
    {
      name: 'Marker Cleansing',
      passed: true,
      errors: []
    }
  ]
}
```

---

## Testing the Integration

```javascript
// Test endpoint connectivity
async function testBackend() {
  const health = await fetch("http://localhost:5000").then((r) => r.json());
  console.log("Backend health:", health);

  // Test Socket connection
  const socket = io("http://localhost:5000");
  socket.on("connect", () => console.log("✅ Socket connected"));

  // Test room creation
  const room = await fetch("http://localhost:5000/api/rooms/create", {
    method: "POST",
  }).then((r) => r.json());
  console.log("✅ Room created:", room.roomId);
}
```

---

## Common Integration Patterns

### Real-time Collaboration Pattern

```javascript
// Setup: Initialize connection on mount
useEffect(() => {
  setupSocketListeners();
}, []);

// Update: Send changes on every keystroke
const handleEditorChange = (newCode) => {
  setCode(newCode);
  socket.emit("SYNC_WORKSPACE_EDIT", { fullText: newCode });
};

// Receive: Update editor when peer changes code
socket.on("WORKSPACE_UPDATED", (data) => {
  if (data.updatedBy !== getMySlot()) {
    setCode(data.fullText);
  }
});
```

### Phase Management Pattern

```javascript
// State
const [phase, setPhase] = useState("LOBBY");

// Listener
socket.on("ROOM_STATE_TRANSITION", (data) => {
  setPhase(data.phase);
  handlePhaseChange(data.phase);
});

// Handlers
const handlePhaseChange = (newPhase) => {
  switch (newPhase) {
    case "EDIT_PHASE":
      showEditor();
      break;
    case "CONFLICT_MODE":
      showConflictResolver();
      break;
    case "SUCCESS_SCREEN":
      showSuccessScreen();
      break;
  }
};
```

---

## Debugging

### Enable Debug Logging

```javascript
// Log all socket events
socket.onAny((eventName, ...args) => {
  console.log(`[Socket Event] ${eventName}`, args);
});

// Log all messages
socket.on("*", (args) => {
  console.log("[All Events]", args);
});
```

### Monitor Network Traffic

Use browser DevTools → Network → WS to monitor WebSocket frames in detail

---

That's it! Your backend is ready for frontend integration! 🚀
