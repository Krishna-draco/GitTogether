const {
  generateRoomId,
  generateCommitHash,
  getCurrentTimestamp,
  deepClone,
} = require("./utils");
const { createConflictFile } = require("./diffEngine");
const { Room, DuelHistory } = require("./database");

const ROOM_TIMEOUT = 120000; // 120 seconds for session resilience

class RoomManager {
  constructor() {
    this.rooms = {}; // roomId -> DuelRoom
    this.socketToRoom = {}; // socketId -> roomId
    this.cleanupIntervals = new Map();
  }

  /**
   * Create a new duel room
   * @returns {string} roomId
   */
  async createRoom() {
    const roomId = generateRoomId();
    const initialCommitHash = generateCommitHash();

    this.rooms[roomId] = {
      roomId,
      currentPhase: "LOBBY",
      players: {
        alpha: {
          socketId: null,
          username: "",
          status: "IDLE",
          branchContent: "",
        },
        beta: {
          socketId: null,
          username: "",
          status: "IDLE",
          branchContent: "",
        },
      },
      repository: {
        branches: {
          main: initialCommitHash,
          alpha: initialCommitHash,
          beta: initialCommitHash,
        },
        commits: {
          [initialCommitHash]: {
            hash: initialCommitHash,
            parentHash: null,
            author: "system",
            message: "Initial commit",
            snapshot: {
              "code.js": `// Initial Code - Both developers start here
function initialFunction() {
  console.log('Start developing!');
  // Developer Alpha: Make your changes here
  // Developer Beta: Make your changes here
  return true;
}`,
            },
          },
        },
      },
      activeConflicts: [],
      liveResolvedCode: "",
      createdAt: getCurrentTimestamp(),
      lastActivityAt: getCurrentTimestamp(),
      sessionTimeout: null,
      messageQueue: [], // FIFO queue for concurrent edits
    };

    // Persist initial room to MongoDB
    await this.saveRoom(roomId);

    return roomId;
  }

  /**
   * Join a room as a player
   * @param {string} roomId
   * @param {string} socketId
   * @param {string} username
   * @returns {Object} { success: boolean, message: string, slot?: 'alpha'|'beta' }
   */
  async joinRoom(roomId, socketId, username) {
    if (!this.rooms[roomId]) {
      return { success: false, message: "Room not found" };
    }

    const room = this.rooms[roomId];

    // Check if room is in LOBBY phase
    if (room.currentPhase !== "LOBBY") {
      return { success: false, message: "Room is not accepting new players" };
    }

    // Check available slots
    let slot = null;
    if (!room.players.alpha.socketId) {
      slot = "alpha";
      room.players.alpha.socketId = socketId;
      room.players.alpha.username = username;
    } else if (!room.players.beta.socketId) {
      slot = "beta";
      room.players.beta.socketId = socketId;
      room.players.beta.username = username;
    } else {
      return { success: false, message: "Room is full" };
    }

    this.socketToRoom[socketId] = roomId;
    room.lastActivityAt = getCurrentTimestamp();

    // Persist changes
    await this.saveRoom(roomId);

    return {
      success: true,
      message: `Player ${username} joined as ${slot}`,
      slot,
      room: this.getRoomState(roomId),
    };
  }

  /**
   * Leave a room
   * @param {string} socketId
   * @returns {Object}
   */
  async leaveRoom(socketId) {
    const roomId = this.socketToRoom[socketId];

    if (!roomId || !this.rooms[roomId]) {
      return { success: false, message: "No active room" };
    }

    const room = this.rooms[roomId];

    // Identify which player is leaving
    if (room.players.alpha.socketId === socketId) {
      room.players.alpha = {
        socketId: null,
        username: "",
        status: "IDLE",
        branchContent: "",
      };
    } else if (room.players.beta.socketId === socketId) {
      room.players.beta = {
        socketId: null,
        username: "",
        status: "IDLE",
        branchContent: "",
      };
    }

    delete this.socketToRoom[socketId];

    // If both players have left, mark room for cleanup
    if (!room.players.alpha.socketId && !room.players.beta.socketId) {
      this.scheduleRoomCleanup(roomId, 5000); // Cleanup after 5 seconds
    } else if (room.currentPhase !== "LOBBY") {
      // If in middle of session, set timeout for session recovery
      this.setSessionTimeout(roomId);
    }

    // Persist changes
    if (roomId) await this.saveRoom(roomId);

    return { success: true, message: "Player disconnected" };
  }

  /**
   * Set session timeout for resilience
   * @param {string} roomId
   */
  setSessionTimeout(roomId) {
    if (!this.rooms[roomId]) return;

    const room = this.rooms[roomId];

    // Clear existing timeout
    if (room.sessionTimeout) {
      clearTimeout(room.sessionTimeout);
    }

    // Set new timeout
    room.sessionTimeout = setTimeout(() => {
      if (this.rooms[roomId]) {
        delete this.rooms[roomId];
      }
    }, ROOM_TIMEOUT);
  }

  /**
   * Schedule room cleanup
   * @param {string} roomId
   * @param {number} delay
   */
  scheduleRoomCleanup(roomId, delay) {
    if (this.cleanupIntervals.has(roomId)) {
      clearTimeout(this.cleanupIntervals.get(roomId));
    }

    const timeoutId = setTimeout(() => {
      delete this.rooms[roomId];
      this.cleanupIntervals.delete(roomId);
    }, delay);

    this.cleanupIntervals.set(roomId, timeoutId);
  }

  /**
   * Transition room to next phase
   * @param {string} roomId
   * @param {string} newPhase
   * @returns {Object}
   */
  async transitionPhase(roomId, newPhase) {
    if (!this.rooms[roomId]) {
      return { success: false, message: "Room not found" };
    }

    const room = this.rooms[roomId];
    const validPhases = [
      "LOBBY",
      "EDIT_PHASE",
      "CONFLICT_MODE",
      "SUCCESS_SCREEN",
    ];

    if (!validPhases.includes(newPhase)) {
      return { success: false, message: "Invalid phase" };
    }

    room.currentPhase = newPhase;
    room.lastActivityAt = getCurrentTimestamp();

    // Initialize edit phase
    if (newPhase === "EDIT_PHASE") {
      const mainCommit = room.repository.commits[room.repository.branches.main];
      const initialCode = mainCommit.snapshot["code.js"];

      // Deep copy for each player
      room.players.alpha.branchContent = initialCode;
      room.players.beta.branchContent = initialCode;
      room.liveResolvedCode = "";
    }

    // Initialize conflict mode
    if (newPhase === "CONFLICT_MODE") {
      room.liveResolvedCode = room.activeConflicts[0]?.mergedWithMarkers || "";
    }

    // Persist phase change
    await this.saveRoom(roomId);

    return { success: true, message: "Phase transitioned", newPhase };
  }

  /**
   * Update player branch content and status
   * @param {string} roomId
   * @param {string} playerSlot - 'alpha' or 'beta'
   * @param {string} content
   * @returns {Object}
   */
  async updateBranchContent(roomId, playerSlot, content) {
    if (!this.rooms[roomId]) {
      return { success: false, message: "Room not found" };
    }

    const room = this.rooms[roomId];
    room.players[playerSlot].branchContent = content;
    room.players[playerSlot].status = "COMMITTED";
    room.lastActivityAt = getCurrentTimestamp();

    // Check if both players have committed
    const bothCommitted =
      room.players.alpha.status === "COMMITTED" &&
      room.players.beta.status === "COMMITTED";

    // Persist changes
    await this.saveRoom(roomId);

    return {
      success: true,
      bothCommitted,
      alphaStatus: room.players.alpha.status,
      betaStatus: room.players.beta.status,
    };
  }

  /**
   * Generate conflicts from committed branches
   * @param {string} roomId
   * @returns {Object}
   */
  async generateConflicts(roomId) {
    if (!this.rooms[roomId]) {
      return { success: false, message: "Room not found" };
    }

    const room = this.rooms[roomId];
    const mainCommit = room.repository.commits[room.repository.branches.main];
    const baseContent = mainCommit.snapshot["code.js"];

    const alphaContent = room.players.alpha.branchContent;
    const betaContent = room.players.beta.branchContent;

    // Create conflict file
    const conflictFile = createConflictFile(
      "code.js",
      baseContent,
      alphaContent,
      betaContent,
    );

    room.activeConflicts = [conflictFile];
    room.liveResolvedCode = conflictFile.mergedWithMarkers;

    // Persist conflict data
    await this.saveRoom(roomId);

    return {
      success: true,
      conflict: conflictFile,
      message: "Conflicts generated",
    };
  }

  /**
   * Update live resolved code (FIFO processing)
   * @param {string} roomId
   * @param {string} content
   * @returns {Object}
   */
  async updateLiveResolvedCode(roomId, content) {
    if (!this.rooms[roomId]) {
      return { success: false, message: "Room not found" };
    }

    const room = this.rooms[roomId];
    room.liveResolvedCode = content;
    room.lastActivityAt = getCurrentTimestamp();

    // Persist live code updates
    await this.saveRoom(roomId);

    return { success: true, content };
  }

  /**
   * Create merge commit
   * @param {string} roomId
   * @param {string} mergeAuthor
   * @returns {Object}
   */
  async createMergeCommit(roomId, mergeAuthor) {
    if (!this.rooms[roomId]) {
      return { success: false, message: "Room not found" };
    }

    const room = this.rooms[roomId];
    const mergeHash = generateCommitHash();
    const mainHash = room.repository.branches.main;
    const alphaHash = room.repository.branches.alpha;
    const betaHash = room.repository.branches.beta;

    const mergeCommit = {
      hash: mergeHash,
      parentHash: [alphaHash, betaHash], // Two parents for merge commit
      author: mergeAuthor,
      message: `Merge branch 'alpha' into 'main' - Resolved conflicts`,
      snapshot: {
        "code.js": room.liveResolvedCode,
      },
    };

    room.repository.commits[mergeHash] = mergeCommit;
    room.repository.branches.main = mergeHash;
    room.currentPhase = "SUCCESS_SCREEN";

    // Persist merge commit
    await this.saveRoom(roomId);

    // Save duel history to MongoDB
    try {
      const alphaPlayer = room.players.alpha;
      const betaPlayer = room.players.beta;
      await this.saveDuelHistory(
        roomId,
        {
          userId: alphaPlayer.userId,
          username: alphaPlayer.username,
          initialCode: null,
          finalCode: alphaPlayer.branchContent,
        },
        {
          userId: betaPlayer.userId,
          username: betaPlayer.username,
          initialCode: null,
          finalCode: betaPlayer.branchContent,
        },
        room.liveResolvedCode,
        { passed: true, score: {} },
      );
    } catch (err) {
      console.error("[RoomManager] Error saving duel history:", err.message);
    }

    // Remove active room from memory and DB (archive kept in duel_history)
    try {
      await Room.deleteOne({ roomId });
    } catch (err) {
      console.error("[RoomManager] Error deleting room from DB:", err.message);
    }

    delete this.rooms[roomId];

    return {
      success: true,
      mergeCommit,
      message: "Merge commit created",
    };
  }

  /**
   * Load rooms from MongoDB into memory at startup
   */
  async loadRoomsFromDB() {
    try {
      const docs = await Room.find({}).lean();
      docs.forEach((d) => {
        // Ensure roomId exists
        if (d && d.roomId) {
          this.rooms[d.roomId] = d;
        }
      });
      console.log(`✅ Loaded ${docs.length} rooms from MongoDB`);
    } catch (err) {
      console.error("[RoomManager] Error loading rooms from DB:", err.message);
    }
  }

  /**
   * Get current room state
   * @param {string} roomId
   * @returns {Object}
   */
  getRoomState(roomId) {
    if (!this.rooms[roomId]) {
      return null;
    }

    const room = this.rooms[roomId];
    return deepClone(room);
  }

  /**
   * Get room by socket ID
   * @param {string} socketId
   * @returns {Object|null}
   */
  getRoomBySocketId(socketId) {
    const roomId = this.socketToRoom[socketId];
    return this.getRoomState(roomId);
  }

  /**
   * Delete room
   * @param {string} roomId
   */
  deleteRoom(roomId) {
    if (this.rooms[roomId]) {
      delete this.rooms[roomId];
    }
  }

  /**
   * Get all active rooms count
   * @returns {number}
   */
  getActiveRoomsCount() {
    return Object.keys(this.rooms).length;
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    Object.keys(this.rooms).forEach((roomId) => {
      const room = this.rooms[roomId];
      if (room.sessionTimeout) {
        clearTimeout(room.sessionTimeout);
      }
    });

    this.cleanupIntervals.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    this.rooms = {};
    this.socketToRoom = {};
    this.cleanupIntervals.clear();
  }

  /**
   * Save room to MongoDB (for persistence)
   * @param {string} roomId
   */
  async saveRoom(roomId) {
    try {
      const room = this.rooms[roomId];
      if (!room) return;

      await Room.updateOne({ roomId }, { $set: room }, { upsert: true });
    } catch (err) {
      console.error(`[MongoDB] Error saving room ${roomId}:`, err.message);
    }
  }

  /**
   * Save completed duel to history (MongoDB)
   * @param {string} roomId
   * @param {Object} alphaPlayer
   * @param {Object} betaPlayer
   * @param {string} mergedCode
   * @param {Object} verificationResult
   */
  async saveDuelHistory(
    roomId,
    alphaPlayer,
    betaPlayer,
    mergedCode,
    verificationResult,
  ) {
    try {
      const room = this.rooms[roomId];
      const duelHistory = new DuelHistory({
        roomId,
        alphaPlayer,
        betaPlayer,
        mergedCode,
        conflicts: room?.activeConflicts || [],
        duration: room?.duration || 0,
        verificationPassed: verificationResult?.passed || false,
        score: verificationResult?.score || {},
      });
      await duelHistory.save();
      console.log(`✅ Duel history saved for room ${roomId}`);
    } catch (err) {
      console.error(
        `[MongoDB] Error saving duel history ${roomId}:`,
        err.message,
      );
    }
  }
}

module.exports = new RoomManager();
