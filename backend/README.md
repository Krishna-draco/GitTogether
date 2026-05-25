# DevDuel Backend - Real-time Git Conflict Resolution Simulator

## Overview

DevDuel Backend is a Node.js/Express server that simulates Git conflict resolution in real-time using Socket.io. It provides an in-memory Git repository state machine that allows two concurrent developers to create, manage, and resolve merge conflicts.

## Architecture

### Core Components

1. **Room Manager** (`roomManager.js`)
   - Manages duel room lifecycle
   - Tracks player connections and status
   - Maintains in-memory Git repository state
   - Handles session timeouts and recovery (120 seconds)
   - FIFO message queue for concurrent edit handling

2. **Diff Engine** (`diffEngine.js`)
   - Three-way merge conflict detection
   - Line-by-line and character-level comparison
   - Generates standard Git conflict markers
   - Auto-merges non-conflicting changes
   - Extracts conflict sections for display

3. **Verification Engine** (`verificationEngine.js`)
   - **Pass 1**: Marker Cleansing - Detects unresolved conflict markers
   - **Pass 2**: Empty State Check - Ensures code wasn't wiped out
   - **Pass 3**: Syntax Smoke Test - Validates JavaScript syntax and bracket balance
   - **Pass 4**: Content Integrity Check - Detects file corruption

4. **Socket.io Handlers** (`socketHandlers.js`)
   - Real-time event processing
   - Player synchronization
   - Cursor position tracking
   - Workspace editing broadcast
   - Conflict generation and verification

## Data Model

### DuelRoom

```javascript
{
  roomId: "room_abc123",
  currentPhase: "EDIT_PHASE" | "CONFLICT_MODE" | "SUCCESS_SCREEN",
  players: {
    alpha: { socketId, username, status, branchContent },
    beta: { socketId, username, status, branchContent }
  },
  repository: {
    branches: { main, alpha, beta },
    commits: { [hash]: GitCommit }
  },
  activeConflicts: [ConflictFile],
  liveResolvedCode: string,
  messageQueue: [] // FIFO queue for concurrent edits
}
```

### GitCommit

```javascript
{
  hash: "abc123def456",
  parentHash: "parent_hash" | null,
  author: "developer_name",
  message: "commit message",
  snapshot: { "filename": "file_content" }
}
```

### ConflictFile

```javascript
{
  filename: "code.js",
  baseContent: "original code",
  alphaContent: "alpha's changes",
  betaContent: "beta's changes",
  mergedWithMarkers: "<<<<<<< HEAD\n...\n>>>>>>>",
  conflictSections: [{ startLine, headContent, incomingContent }]
}
```

## REST API Endpoints

### Health Check

```
GET /
Returns server status and version
```

### Create Room

```
POST /api/rooms/create
Response: { success, roomId, shareUrl }
```

### Get Room State

```
GET /api/rooms/:roomId
Response: { success, room }
```

### List All Rooms

```
GET /api/rooms
Response: { success, activeRooms, rooms }
```

### Delete Room

```
DELETE /api/rooms/:roomId
Response: { success, message }
```

### Server Statistics

```
GET /api/stats
Response: { success, stats: { activeRooms, connectedSockets, timestamp } }
```

## Socket.io Events

### Inbound Events (Client → Server)

#### JOIN_DUEL_ROOM

Join a duel room as a player.

```javascript
socket.emit(
  "JOIN_DUEL_ROOM",
  {
    roomId: "room_abc123",
    username: "Developer Alpha",
  },
  callback,
);

// Response
callback({
  success: true,
  slot: "alpha",
  roomState: DuelRoom,
});
```

#### START_EDIT_PHASE

Transition room to edit phase (both players must be present).

```javascript
socket.emit("START_EDIT_PHASE", {}, callback);

// Response
callback({
  success: true,
  roomState: DuelRoom,
});
```

#### SUBMIT_BRANCH_COMMIT

Submit branch commit when ready to create conflicts.

```javascript
socket.emit(
  "SUBMIT_BRANCH_COMMIT",
  {
    content: "modified code content",
  },
  callback,
);

// Response
callback({
  success: true,
  bothCommitted: true,
  message: "Conflicts generated!",
});
```

#### SYNC_WORKSPACE_EDIT

Real-time synchronization of shared editor.

```javascript
socket.emit(
  "SYNC_WORKSPACE_EDIT",
  {
    fullText: "resolved code content",
    // OR delta: { /* OT delta */ }
  },
  callback,
);

// Response
callback({ success: true });
```

#### CURSOR_POSITION_MOVE

Broadcast cursor position for presence indicators.

```javascript
socket.emit(
  "CURSOR_POSITION_MOVE",
  {
    line: 10,
    ch: 5,
  },
  callback,
);

// Response
callback({ success: true });
```

#### REQUEST_MERGE_VERIFICATION

Trigger verification and merge commit creation.

```javascript
socket.emit('REQUEST_MERGE_VERIFICATION', {}, callback)

// Response
callback({
  success: true,
  message: 'Verification passed!',
  verificationResult: {
    success: true,
    passedChecks: 4,
    totalChecks: 4,
    errors: [],
    details: [...]
  }
})
```

#### GET_ROOM_STATE

Get current room state.

```javascript
socket.emit("GET_ROOM_STATE", {}, callback);

// Response
callback({
  success: true,
  roomState: DuelRoom,
});
```

### Outbound Events (Server → Client)

#### ROOM_UPDATED

Room state has been updated.

```javascript
socket.on("ROOM_UPDATED", {
  roomState: DuelRoom,
  message: string,
});
```

#### ROOM_STATE_TRANSITION

Room transitioned to a new phase.

```javascript
socket.on("ROOM_STATE_TRANSITION", {
  phase: "CONFLICT_MODE",
  payload: DuelRoom,
  conflict: ConflictFile,
  verificationResult: Object,
  message: string,
});
```

#### BOTH_PLAYERS_READY

Both players have connected and can start.

```javascript
socket.on("BOTH_PLAYERS_READY", {
  message: "Both players are connected. Ready to start!",
});
```

#### WORKSPACE_UPDATED

Peer has updated the shared workspace.

```javascript
socket.on("WORKSPACE_UPDATED", {
  fullText: string,
  updatedBy: "alpha" | "beta",
  timestamp: number,
});
```

#### PEER_CURSOR_UPDATED

Peer cursor position for presence indicators.

```javascript
socket.on("PEER_CURSOR_UPDATED", {
  username: string,
  playerSlot: "alpha" | "beta",
  line: number,
  ch: number,
  timestamp: number,
});
```

#### VERIFICATION_RESULT

Verification completed with results.

```javascript
socket.on('VERIFICATION_RESULT', {
  success: boolean,
  errors: string[],
  details: Array<{
    name: string,
    passed: boolean,
    errors: string[]
  }>
})
```

## Workflow Phases

### Phase 1: LOBBY

- Players join the room
- Wait for both players to connect
- Once both connected, ready to proceed

### Phase 2: EDIT_PHASE

- Both players receive initial code from main branch
- Each player independently modifies their branch
- Players commit when ready
- Transition to CONFLICT_MODE when both commit

### Phase 3: CONFLICT_MODE

- Diff engine generates conflicts
- Players see code with conflict markers
- Real-time collaboration to resolve
- Cursor positions shown for presence
- Verification run when ready

### Phase 4: SUCCESS_SCREEN

- Merge commit created
- Show success message
- Display merged code history

## Verification Process

The verification engine runs 4 passes:

1. **Marker Cleansing**
   - Regex: `/^<{7}|^={7}|^>{7}/m`
   - Ensures no `<<<<<<<`, `=======`, `>>>>>>>` remain

2. **Empty State Check**
   - Code must not be empty
   - Must retain >10% of original content
   - Must have non-comment code

3. **Syntax Smoke Test**
   - Validates JavaScript syntax
   - Checks bracket balance: `{}`, `()`, `[]`

4. **Content Integrity Check**
   - Detects file corruption
   - Checks for null bytes or invalid characters

## Session Resilience

- **Timeout**: 120 seconds if player disconnects
- **Recovery**: Automatic reconnection restores session state
- **Handshake Token**: Socket ID acts as session identifier

## Concurrency Management

- **FIFO Message Queue**: Serializes concurrent edits
- **Centralized Synchronization**: Server is single source of truth
- **Race Condition Prevention**: Sequential processing of all updates

## Installation

```bash
cd backend
npm install
```

## Environment Variables

```bash
PORT=5000
HOST=localhost
NODE_ENV=development
```

## Running the Server

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Testing the Backend

### Using curl to create a room

```bash
curl -X POST http://localhost:5000/api/rooms/create
```

### Using curl to check room state

```bash
curl http://localhost:5000/api/rooms/room_abc123
```

### Using curl to check stats

```bash
curl http://localhost:5000/api/stats
```

## WebSocket Connection Example

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected");

  socket.emit(
    "JOIN_DUEL_ROOM",
    {
      roomId: "room_abc123",
      username: "Developer Alpha",
    },
    (response) => {
      console.log("Joined:", response);
    },
  );
});

socket.on("ROOM_STATE_TRANSITION", (data) => {
  console.log("Phase changed to:", data.phase);
});
```

## Performance Considerations

- **In-Memory Storage**: All data stored in RAM for speed
- **No Database**: Designed for simulation only
- **Cleanup**: Automatic cleanup after 120s timeout
- **Scalability**: Single-instance design (can be extended with Redis for multi-instance)

## Security Notes

- CORS enabled for development (restrict in production)
- No authentication implemented (add for production)
- WebSocket transport with fallback to polling
- Input validation on all endpoints

## Future Enhancements

- Database persistence
- Multi-room namespaces
- Redis for multi-instance support
- Advanced OT (Operational Transform) for concurrent edits
- Real Git integration
- User authentication
- Room access control
- Audit logging
- Metrics and analytics

## Support

For issues or questions, refer to the main DevDuel documentation.
