const roomManager = require("./roomManager");
const {
  runCompleteVerification,
  getVerificationSummary,
} = require("./verificationEngine");
const { getCurrentTimestamp } = require("./utils");

/**
 * Register all Socket.io event handlers
 * @param {Object} io - Socket.io instance
 */
function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // Simple socket auth handshake
    try {
      const auth = require("./auth");
      socket.on("AUTHENTICATE", (data, callback) => {
        try {
          const token =
            data && data.token
              ? data.token
              : socket.handshake &&
                socket.handshake.auth &&
                socket.handshake.auth.token;
          if (!token)
            return (
              callback &&
              callback({ success: false, error: "No token provided" })
            );

          const v = auth.verifyToken(token);
          if (!v.valid)
            return (
              callback && callback({ success: false, error: "Invalid token" })
            );

          socket.user = { id: v.decoded.sub, username: v.decoded.username };
          callback && callback({ success: true, user: socket.user });
        } catch (err) {
          console.error("[AUTHENTICATE Error]:", err);
          callback && callback({ success: false, error: err.message });
        }
      });
    } catch (err) {
      console.warn("Auth module not available for socket authentication");
    }

    /**
     * EVENT: JOIN_DUEL_ROOM
     * Player joins a duel room
     */
    socket.on("JOIN_DUEL_ROOM", async (data, callback) => {
      try {
        const { roomId, username } = data;

        if (!roomId || !username) {
          return callback({
            success: false,
            error: "Missing roomId or username",
          });
        }

        const result = await roomManager.joinRoom(roomId, socket.id, username);

        if (result.success) {
          socket.join(roomId);
          io.to(roomId).emit("ROOM_UPDATED", {
            roomState: result.room,
            message: result.message,
          });

          // Check if both players are ready to start
          if (
            result.room.players.alpha.socketId &&
            result.room.players.beta.socketId
          ) {
            io.to(roomId).emit("BOTH_PLAYERS_READY", {
              message: "Both players are connected. Ready to start!",
            });
          }

          callback({
            success: true,
            slot: result.slot,
            roomState: result.room,
          });
        } else {
          callback({ success: false, error: result.message });
        }
      } catch (error) {
        console.error("[JOIN_DUEL_ROOM Error]:", error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * EVENT: START_EDIT_PHASE
     * Transitions room to EDIT_PHASE
     */
    socket.on("START_EDIT_PHASE", async (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ success: false, error: "Room not found" });
        }

        // Verify both players are present
        if (!room.players.alpha.socketId || !room.players.beta.socketId) {
          return callback({
            success: false,
            error: "Both players must be present",
          });
        }

        const result = await roomManager.transitionPhase(
          room.roomId,
          "EDIT_PHASE",
        );

        if (result.success) {
          const updatedRoom = roomManager.getRoomState(room.roomId);
          io.to(room.roomId).emit("ROOM_STATE_TRANSITION", {
            phase: "EDIT_PHASE",
            payload: updatedRoom,
            message:
              "Edit phase started! Both developers can now make changes.",
          });

          callback({ success: true, roomState: updatedRoom });
        } else {
          callback({ success: false, error: result.message });
        }
      } catch (error) {
        console.error("[START_EDIT_PHASE Error]:", error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * EVENT: SUBMIT_BRANCH_COMMIT
     * Developer commits their branch changes
     */
    socket.on("SUBMIT_BRANCH_COMMIT", async (data, callback) => {
      try {
        const { content } = data;
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ success: false, error: "Room not found" });
        }

        // Identify player slot
        let playerSlot = null;
        if (room.players.alpha.socketId === socket.id) {
          playerSlot = "alpha";
        } else if (room.players.beta.socketId === socket.id) {
          playerSlot = "beta";
        } else {
          return callback({
            success: false,
            error: "Player not found in room",
          });
        }

        const result = await roomManager.updateBranchContent(
          room.roomId,
          playerSlot,
          content,
        );

        if (result.bothCommitted) {
          // Both players have committed - trigger conflict mode
          const conflictResult = await roomManager.generateConflicts(
            room.roomId,
          );

          if (conflictResult.success) {
            await roomManager.transitionPhase(room.roomId, "CONFLICT_MODE");
            const updatedRoom = roomManager.getRoomState(room.roomId);

            io.to(room.roomId).emit("ROOM_STATE_TRANSITION", {
              phase: "CONFLICT_MODE",
              payload: updatedRoom,
              conflict: conflictResult.conflict,
              message: "Conflicts detected! Time to resolve them together!",
            });
          }
        } else {
          // Waiting for other player
          io.to(room.roomId).emit("ROOM_UPDATED", {
            roomState: roomManager.getRoomState(room.roomId),
            message: `${playerSlot} committed. Waiting for ${playerSlot === "alpha" ? "beta" : "alpha"}...`,
          });
        }

        callback({
          success: true,
          playerSlot,
          bothCommitted: result.bothCommitted,
          message: result.bothCommitted
            ? "Conflicts generated!"
            : "Commit received, waiting for peer...",
        });
      } catch (error) {
        console.error("[SUBMIT_BRANCH_COMMIT Error]:", error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * EVENT: SYNC_WORKSPACE_EDIT
     * Real-time workspace synchronization
     */
    socket.on("SYNC_WORKSPACE_EDIT", async (data, callback) => {
      try {
        const { fullText, delta } = data;
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ success: false, error: "Room not found" });
        }

        // Use fullText if provided, otherwise apply delta (simplified - no actual OT)
        const updatedCode = fullText || room.liveResolvedCode;

        const result = await roomManager.updateLiveResolvedCode(
          room.roomId,
          updatedCode,
        );

        if (result.success) {
          // Broadcast to all users except sender
          socket.to(room.roomId).emit("WORKSPACE_UPDATED", {
            fullText: result.content,
            updatedBy:
              room.players.alpha.socketId === socket.id ? "alpha" : "beta",
            timestamp: getCurrentTimestamp(),
          });

          callback({ success: true });
        } else {
          callback({ success: false, error: result.message });
        }
      } catch (error) {
        console.error("[SYNC_WORKSPACE_EDIT Error]:", error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * EVENT: CURSOR_POSITION_MOVE
     * Broadcast cursor position for presence indicators
     */
    socket.on("CURSOR_POSITION_MOVE", (data, callback) => {
      try {
        const { line, ch } = data;
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ success: false, error: "Room not found" });
        }

        const playerSlot =
          room.players.alpha.socketId === socket.id ? "alpha" : "beta";
        const username = room.players[playerSlot].username;

        socket.to(room.roomId).emit("PEER_CURSOR_UPDATED", {
          username,
          playerSlot,
          line,
          ch,
          timestamp: getCurrentTimestamp(),
        });

        callback({ success: true });
      } catch (error) {
        console.error("[CURSOR_POSITION_MOVE Error]:", error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * EVENT: REQUEST_MERGE_VERIFICATION
     * Trigger verification of the resolved code
     */
    socket.on("REQUEST_MERGE_VERIFICATION", async (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ success: false, error: "Room not found" });
        }

        if (room.currentPhase !== "CONFLICT_MODE") {
          return callback({
            success: false,
            error: "Not in conflict resolution mode",
          });
        }

        // Get versions for verification
        const versions = {
          baseContent:
            room.repository.commits[room.repository.branches.main].snapshot[
              "code.js"
            ],
          alphaContent: room.players.alpha.branchContent,
          betaContent: room.players.beta.branchContent,
        };

        // Run complete verification
        const verificationResult = runCompleteVerification(
          room.liveResolvedCode,
          versions,
        );
        const summary = getVerificationSummary(verificationResult);

        if (verificationResult.success) {
          // Verification passed - create merge commit
          const mergeResult = await roomManager.createMergeCommit(
            room.roomId,
            `${room.players.alpha.username} & ${room.players.beta.username}`,
          );

          const finalRoom = roomManager.getRoomState(room.roomId);

          io.to(room.roomId).emit("ROOM_STATE_TRANSITION", {
            phase: "SUCCESS_SCREEN",
            payload: finalRoom,
            verificationResult: summary,
            message: "Merge successful! Conflicts resolved!",
          });

          callback({
            success: true,
            message: "Verification passed!",
            verificationResult: summary,
          });
        } else {
          // Verification failed
          io.to(room.roomId).emit("VERIFICATION_RESULT", {
            success: false,
            errors: summary.errors,
            details: summary.details,
          });

          callback({
            success: false,
            message: "Verification failed",
            verificationResult: summary,
          });
        }
      } catch (error) {
        console.error("[REQUEST_MERGE_VERIFICATION Error]:", error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * EVENT: GET_ROOM_STATE
     * Get current room state
     */
    socket.on("GET_ROOM_STATE", async (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ success: false, error: "Room not found" });
        }

        callback({ success: true, roomState: room });
      } catch (error) {
        console.error("[GET_ROOM_STATE Error]:", error);
        callback({ success: false, error: error.message });
      }
    });

    /**
     * EVENT: disconnect
     * Handle player disconnection
     */
    socket.on("disconnect", async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const result = await roomManager.leaveRoom(socket.id);

      if (result.success) {
        const roomId =
          result.roomId ||
          Object.keys(roomManager.rooms).find(
            (id) =>
              !roomManager.rooms[id].players.alpha.socketId ||
              !roomManager.rooms[id].players.beta.socketId,
          );

        if (roomId && roomManager.rooms[roomId]) {
          io.to(roomId).emit("ROOM_UPDATED", {
            roomState: roomManager.getRoomState(roomId),
            message: "Player disconnected. Waiting for reconnection...",
          });
        }
      }
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
