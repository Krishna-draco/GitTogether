/**
 * Constants for DevDuel Backend
 */

const PHASES = {
  LOBBY: "LOBBY",
  EDIT_PHASE: "EDIT_PHASE",
  CONFLICT_MODE: "CONFLICT_MODE",
  SUCCESS_SCREEN: "SUCCESS_SCREEN",
};

const PLAYER_SLOTS = {
  ALPHA: "alpha",
  BETA: "beta",
};

const PLAYER_STATUSES = {
  IDLE: "IDLE",
  TYPING: "TYPING",
  COMMITTED: "COMMITTED",
};

const SOCKET_EVENTS = {
  // Inbound Events (Client → Server)
  JOIN_DUEL_ROOM: "JOIN_DUEL_ROOM",
  START_EDIT_PHASE: "START_EDIT_PHASE",
  SUBMIT_BRANCH_COMMIT: "SUBMIT_BRANCH_COMMIT",
  SYNC_WORKSPACE_EDIT: "SYNC_WORKSPACE_EDIT",
  CURSOR_POSITION_MOVE: "CURSOR_POSITION_MOVE",
  REQUEST_MERGE_VERIFICATION: "REQUEST_MERGE_VERIFICATION",
  GET_ROOM_STATE: "GET_ROOM_STATE",

  // Outbound Events (Server → Client)
  ROOM_UPDATED: "ROOM_UPDATED",
  ROOM_STATE_TRANSITION: "ROOM_STATE_TRANSITION",
  BOTH_PLAYERS_READY: "BOTH_PLAYERS_READY",
  WORKSPACE_UPDATED: "WORKSPACE_UPDATED",
  PEER_CURSOR_UPDATED: "PEER_CURSOR_UPDATED",
  VERIFICATION_RESULT: "VERIFICATION_RESULT",
};

const HTTP_ENDPOINTS = {
  HEALTH: "/",
  CREATE_ROOM: "/api/rooms/create",
  GET_ROOM: "/api/rooms/:roomId",
  LIST_ROOMS: "/api/rooms",
  DELETE_ROOM: "/api/rooms/:roomId",
  STATS: "/api/stats",
};

const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "Room not found",
  ROOM_FULL: "Room is full",
  NOT_IN_LOBBY: "Room is not accepting new players",
  BOTH_PLAYERS_REQUIRED: "Both players must be present",
  PLAYER_NOT_FOUND: "Player not found in room",
  NOT_IN_CONFLICT_MODE: "Not in conflict resolution mode",
  MISSING_PARAMS: "Missing required parameters",
  INTERNAL_ERROR: "Internal server error",
};

const CONFLICT_MARKERS = {
  HEAD_START: "<<<<<<< HEAD",
  SEPARATOR: "=======",
  END: ">>>>>>>",
  REGEX: /^<{7}|^={7}|^>{7}/m,
};

const VERIFICATION_ERRORS = {
  MARKERS_EXIST:
    "Merge failed: Unresolved conflict markers still exist in the file.",
  EMPTY_CODE:
    "Merge failed: Code cannot be empty. Must contain resolved content.",
  CONTENT_LOST:
    "Merge failed: Resolved code has lost significant content. Ensure both branches are properly merged.",
  ONLY_COMMENTS:
    "Merge failed: Code contains only comments. Ensure actual code is present.",
  SYNTAX_ERROR: "Syntax Error",
  FILE_CORRUPTION:
    "Merge failed: Detected file corruption or invalid characters in resolved code.",
};

module.exports = {
  PHASES,
  PLAYER_SLOTS,
  PLAYER_STATUSES,
  SOCKET_EVENTS,
  HTTP_ENDPOINTS,
  ERROR_MESSAGES,
  CONFLICT_MARKERS,
  VERIFICATION_ERRORS,
};
