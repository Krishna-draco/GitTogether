const Room = require("../models/Room");
const Message = require("../models/Message");

const activeRooms = {}; // Cache to track who is in what room in real-time
// Format: { roomId: { socketId: { username, color } } }

const assignUserColor = () => {
  const colors = [
    "#f43f5e", // rose
    "#3b82f6", // blue
    "#10b981", // emerald
    "#eab308", // yellow
    "#a855f7", // purple
    "#ff7849", // orange
    "#ec4899", // pink
    "#14b8a6", // teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const handleSockets = (io) => {
  io.on("connection", (socket) => {
    // Verified user attached in middleware (socket.user)
    const user = socket.user;
    console.log(`User connected to Socket: ${user.username} (${socket.id})`);

    // 1. Join Room Handler
    socket.on("join-room", async ({ roomId }) => {
      try {
        socket.join(roomId);

        // Fetch or create Room in MongoDB
        let room = await Room.findOne({ roomId });
        if (!room) {
          room = await Room.create({
            roomId,
            code1: "// Paste or write your code here (Panel 1)",
            code2: "// Paste or write your code here (Panel 2)",
            codeMerged: "// Collab and resolve conflict here (Panel 3)",
            language: "javascript",
          });
        }

        // Cache room participants
        if (!activeRooms[roomId]) {
          activeRooms[roomId] = {};
        }

        // If user is already in this room cache under a different socket, remove it
        Object.keys(activeRooms[roomId]).forEach((sid) => {
          if (activeRooms[roomId][sid].username === user.username) {
            delete activeRooms[roomId][sid];
          }
        });

        // Set user color and store in active list
        const userColor = assignUserColor();
        activeRooms[roomId][socket.id] = {
          socketId: socket.id,
          username: user.username,
          color: userColor,
        };

        // If user1 or user2 properties in DB are empty, assign the user
        let dbUpdated = false;
        if (!room.user1 && room.user2 !== user.username) {
          room.user1 = user.username;
          dbUpdated = true;
        } else if (!room.user2 && room.user1 !== user.username) {
          room.user2 = user.username;
          dbUpdated = true;
        }
        if (dbUpdated) {
          await room.save();
        }

        // Load chat history from MongoDB
        const messages = await Message.find({ roomId })
          .sort({ timestamp: 1 })
          .limit(100);

        // Send initial room state to the joining user
        socket.emit("room-state", {
          code1: room.code1,
          code2: room.code2,
          codeMerged: room.codeMerged,
          language: room.language,
          user1: room.user1,
          user2: room.user2,
          messages: messages.map((m) => ({
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp,
          })),
          activeUsers: Object.values(activeRooms[roomId]),
          selfColor: userColor,
        });

        // Notify other users in room
        socket.to(roomId).emit("user-joined", {
          username: user.username,
          color: userColor,
          activeUsers: Object.values(activeRooms[roomId]),
          user1: room.user1,
          user2: room.user2,
        });

        console.log(`${user.username} joined room ${roomId}`);
      } catch (err) {
        console.error("Error joining room:", err.message);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // 2. Real-time Code Edits Sync
    socket.on("code-change", async ({ roomId, panel, code }) => {
      try {
        // Broadcast the update immediately to reduce latency
        socket.to(roomId).emit("code-sync", { panel, code });

        // Throttle/Save to database
        const updateData = {};
        if (panel === 1) updateData.code1 = code;
        else if (panel === 2) updateData.code2 = code;
        else if (panel === 3) updateData.codeMerged = code;

        await Room.findOneAndUpdate({ roomId }, updateData);
      } catch (err) {
        console.error("Code change database error:", err.message);
      }
    });

    // 3. Language Selection Sync
    socket.on("language-change", async ({ roomId, language }) => {
      try {
        socket.to(roomId).emit("language-sync", { language });
        await Room.findOneAndUpdate({ roomId }, { language });
      } catch (err) {
        console.error("Language sync error:", err.message);
      }
    });

    // 4. Remote Cursors Sync
    socket.on("cursor-change", ({ roomId, panel, position }) => {
      // Find the sending user's details
      const senderInfo = activeRooms[roomId]?.[socket.id];
      if (senderInfo) {
        socket.to(roomId).emit("cursor-sync", {
          username: senderInfo.username,
          color: senderInfo.color,
          panel,
          position,
        });
      }
    });

    // 5. Chat Messaging
    socket.on("chat-msg", async ({ roomId, text }) => {
      try {
        const senderInfo = activeRooms[roomId]?.[socket.id];
        const username = senderInfo ? senderInfo.username : user.username;

        // Save message to MongoDB
        const newMessage = await Message.create({
          roomId,
          sender: username,
          text,
        });

        // Broadcast message to all clients in the room (including sender)
        io.to(roomId).emit("chat-msg-broadcast", {
          sender: username,
          text,
          timestamp: newMessage.timestamp,
        });
      } catch (err) {
        console.error("Chat error:", err.message);
      }
    });

    // 6. Voice Calling P2P Signaling (WebRTC Relay)
    socket.on("webrtc-offer", ({ roomId, offer, recipientId }) => {
      if (recipientId) {
        io.to(recipientId).emit("webrtc-offer", { offer, sender: socket.id });
        return;
      }
      socket.to(roomId).emit("webrtc-offer", { offer, sender: socket.id });
    });

    socket.on("webrtc-answer", ({ roomId, answer, recipientId }) => {
      if (recipientId) {
        io.to(recipientId).emit("webrtc-answer", { answer, sender: socket.id });
        return;
      }
      socket.to(roomId).emit("webrtc-answer", { answer, sender: socket.id });
    });

    socket.on("webrtc-ice", ({ roomId, candidate, recipientId }) => {
      if (recipientId) {
        io.to(recipientId).emit("webrtc-ice", { candidate, sender: socket.id });
        return;
      }
      socket.to(roomId).emit("webrtc-ice", { candidate, sender: socket.id });
    });

    // 7. Disconnection Clean Up
    socket.on("disconnecting", () => {
      // Clean up rooms the socket is in
      socket.rooms.forEach(async (roomId) => {
        if (activeRooms[roomId] && activeRooms[roomId][socket.id]) {
          const leavingUser = activeRooms[roomId][socket.id].username;
          delete activeRooms[roomId][socket.id];

          // Check if room is completely empty to clear cache
          if (Object.keys(activeRooms[roomId]).length === 0) {
            delete activeRooms[roomId];
          } else {
            // Notify others
            io.to(roomId).emit("user-left", {
              socketId: socket.id,
              username: leavingUser,
              activeUsers: Object.values(activeRooms[roomId]),
            });
          }
        }
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.username} (${socket.id})`);
    });
  });
};

module.exports = handleSockets;
