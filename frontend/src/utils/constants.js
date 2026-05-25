/**
 * Frontend Constants
 */

// Use relative URLs in development to leverage Vite proxy
const isDev = import.meta.env.DEV;

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (isDev ? "" : "http://localhost:5000");
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (isDev ? "http://localhost:5173" : "http://localhost:5000");
export const GITHUB_CLIENT_ID =
  import.meta.env.VITE_GITHUB_CLIENT_ID || "your_client_id";
export const GITHUB_REDIRECT_URI =
  import.meta.env.VITE_GITHUB_REDIRECT_URI ||
  "http://localhost:5173/auth/callback";

// Game Phases
export const GAME_PHASES = {
  LOBBY: "LOBBY",
  EDIT_PHASE: "EDIT_PHASE",
  CONFLICT_MODE: "CONFLICT_MODE",
  SUCCESS_SCREEN: "SUCCESS_SCREEN",
};

// Player Slots
export const PLAYER_SLOTS = {
  ALPHA: "alpha",
  BETA: "beta",
};

// Status
export const PLAYER_STATUS = {
  IDLE: "IDLE",
  TYPING: "TYPING",
  COMMITTED: "COMMITTED",
};

// Colors
export const THEME_COLORS = {
  ALPHA: "#ff6b6b",
  BETA: "#4ecdc4",
  SUCCESS: "#51cf66",
  WARNING: "#ffd43b",
  ERROR: "#ff6b6b",
  BACKGROUND: "#1e1e1e",
  SURFACE: "#2d2d2d",
  TEXT_PRIMARY: "#ffffff",
  TEXT_SECONDARY: "#a0a0a0",
  ACCENT_GREEN: "#00ff88",
};

// Task Instructions
export const MISSION_TASKS = {
  alpha:
    "CRITICAL TASK: Modify line 5 in server.js to shift the listener port to 3000.",
  beta: "CRITICAL TASK: Modify line 5 in server.js to switch the engine listener port to 8080.",
};

// Socket Events
export const SOCKET_EVENTS = {
  // Outbound
  JOIN_DUEL_ROOM: "JOIN_DUEL_ROOM",
  START_EDIT_PHASE: "START_EDIT_PHASE",
  SUBMIT_BRANCH_COMMIT: "SUBMIT_BRANCH_COMMIT",
  SYNC_WORKSPACE_EDIT: "SYNC_WORKSPACE_EDIT",
  CURSOR_POSITION_MOVE: "CURSOR_POSITION_MOVE",
  REQUEST_MERGE_VERIFICATION: "REQUEST_MERGE_VERIFICATION",
  GET_ROOM_STATE: "GET_ROOM_STATE",

  // Inbound
  ROOM_UPDATED: "ROOM_UPDATED",
  ROOM_STATE_TRANSITION: "ROOM_STATE_TRANSITION",
  BOTH_PLAYERS_READY: "BOTH_PLAYERS_READY",
  WORKSPACE_UPDATED: "WORKSPACE_UPDATED",
  PEER_CURSOR_UPDATED: "PEER_CURSOR_UPDATED",
  VERIFICATION_RESULT: "VERIFICATION_RESULT",
};

// File Templates
export const FILE_TEMPLATES = {
  "server.js": `const express = require('express');
const app = express();

// Original base port configuration
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
  "package.json": `{
  "name": "conflict-test",
  "version": "1.0.0",
  "description": "Test project",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^5.0.0"
  }
}
`,
  ".env.example": `PORT=5000
NODE_ENV=development
LOG_LEVEL=info
`,
};

// Merge Actions
export const MERGE_ACTIONS = {
  ACCEPT_ALPHA: "accept-alpha",
  ACCEPT_BETA: "accept-beta",
  BLEND_BOTH: "blend-both",
};

export const MERGE_ACTION_LABELS = {
  [MERGE_ACTIONS.ACCEPT_ALPHA]: "Accept Alpha Changes",
  [MERGE_ACTIONS.ACCEPT_BETA]: "Accept Beta Changes",
  [MERGE_ACTIONS.BLEND_BOTH]: "Blend & Retain Both",
};
