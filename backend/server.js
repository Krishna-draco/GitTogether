const express = require("express");
const dotenv = require("dotenv");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const roomManager = require("./roomManager");
const { registerSocketHandlers } = require("./socketHandlers");
const { connectDB, disconnectDB } = require("./database");

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const auth = require("./auth");

// Configure Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth routes (register/login)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    const user = await auth.registerUser({ username, password, displayName });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await auth.authenticateUser({ username, password });
    res.json({ success: true, user: result.user, token: result.token });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

app.get("/api/auth/me", (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const v = auth.verifyToken(token);
    if (!v.valid)
      return res.status(401).json({ success: false, error: "Invalid token" });
    res.json({ success: true, user: v.decoded });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

// Configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";

// ==================== REST Endpoints ====================

/**
 * GET / - Health check
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "DevDuel Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/rooms/create - Create a new duel room
 */
app.post("/api/rooms/create", async (req, res) => {
  try {
    const roomId = await roomManager.createRoom();
    res.json({
      success: true,
      roomId,
      message: `Room created: ${roomId}`,
      shareUrl: `http://${HOST}:${PORT}/duel/${roomId}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/rooms/:roomId - Get room state
 */
app.get("/api/rooms/:roomId", (req, res) => {
  try {
    const { roomId } = req.params;
    const room = roomManager.getRoomState(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    res.json({
      success: true,
      room,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/rooms - List all active rooms
 */
app.get("/api/rooms", (req, res) => {
  try {
    const rooms = {};
    Object.keys(roomManager.rooms).forEach((roomId) => {
      const room = roomManager.getRoomState(roomId);
      if (room) {
        rooms[roomId] = {
          roomId: room.roomId,
          phase: room.currentPhase,
          playersCount:
            (room.players.alpha.socketId ? 1 : 0) +
            (room.players.beta.socketId ? 1 : 0),
          createdAt: room.createdAt,
        };
      }
    });

    res.json({
      success: true,
      activeRooms: roomManager.getActiveRoomsCount(),
      rooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/rooms/:roomId - Delete a room
 */
app.delete("/api/rooms/:roomId", (req, res) => {
  try {
    const { roomId } = req.params;
    const room = roomManager.getRoomState(roomId);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    roomManager.deleteRoom(roomId);
    res.json({
      success: true,
      message: `Room ${roomId} deleted`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/stats - Get server statistics
 */
app.get("/api/stats", (req, res) => {
  try {
    const stats = {
      activeRooms: roomManager.getActiveRoomsCount(),
      connectedSockets: io.engine.clientsCount || 0,
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== Socket.io Handlers ====================

registerSocketHandlers(io);

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
  console.error("[Error]:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// ==================== Server Startup ====================

async function startServer() {
  // Connect to MongoDB
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error("❌ Failed to connect to MongoDB. Exiting...");
    process.exit(1);
  }

  // Load any persisted rooms from MongoDB
  try {
    await roomManager.loadRoomsFromDB();
  } catch (err) {
    console.warn("Could not load rooms from DB at startup:", err.message);
  }

  httpServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use.`);
      console.error(
        "   Another backend process is already running on this port. Stop the old process or change PORT in .env.",
      );
      process.exit(1);
    }

    console.error("❌ Server listen error:", err);
    process.exit(1);
  });

  httpServer.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                   DevDuel Backend                      ║
║            Real-time Git Conflict Resolution           ║
╚════════════════════════════════════════════════════════╝

🚀 Server started successfully!
📍 Host: ${HOST}
🔌 Port: ${PORT}
🌐 URL: http://${HOST}:${PORT}

✅ Features enabled:
   • Socket.io real-time synchronization
   • MongoDB persistence (users, rooms, duels)
   • Three-way merge conflict detection
   • Verification engine (syntax, markers, content integrity)
   • Session resilience with 120s timeout
   • CORS enabled for frontend integration

📊 Endpoints:
   POST   /api/auth/register      - Register new user
   POST   /api/auth/login         - Login user
   GET    /api/auth/me            - Get current user
   POST   /api/rooms/create       - Create new duel room
   GET    /api/rooms              - List all active rooms
   GET    /api/rooms/:roomId      - Get room state
   DELETE /api/rooms/:roomId      - Delete room
   GET    /api/stats              - Server statistics

🔌 Socket.io Events:
   • JOIN_DUEL_ROOM
   • START_EDIT_PHASE
   • SUBMIT_BRANCH_COMMIT
   • SYNC_WORKSPACE_EDIT
   • CURSOR_POSITION_MOVE
   • REQUEST_MERGE_VERIFICATION
   • GET_ROOM_STATE

Ready to resolve conflicts! 🎯
    `);
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⛔ Shutting down...");
  roomManager.cleanup();
  await disconnectDB();
  httpServer.close(() => {
    console.log("✅ Server shut down successfully");
    process.exit(0);
  });
});

// Start server
startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

module.exports = { app, httpServer, io };
