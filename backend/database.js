const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/devduel";

// ==================== Schemas ====================

// User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
    },
    profileImage: String,
    stats: {
      duelsPlayed: { type: Number, default: 0 },
      duelsWon: { type: Number, default: 0 },
      conflictsResolved: { type: Number, default: 0 },
      totalPlayTime: { type: Number, default: 0 }, // in seconds
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLoginAt: Date,
  },
  { collection: "users" },
);

// Room Schema (for active and completed duels)
const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["LOBBY", "IN_PROGRESS", "COMPLETED", "ABANDONED"],
      default: "LOBBY",
    },
    currentPhase: {
      type: String,
      enum: ["LOBBY", "EDIT_PHASE", "CONFLICT_MODE", "SUCCESS_SCREEN"],
      default: "LOBBY",
    },
    players: {
      alpha: {
        userId: mongoose.Schema.Types.ObjectId,
        username: String,
        status: String,
        branchContent: String,
        commitHash: String,
      },
      beta: {
        userId: mongoose.Schema.Types.ObjectId,
        username: String,
        status: String,
        branchContent: String,
        commitHash: String,
      },
    },
    repository: {
      branches: mongoose.Schema.Types.Mixed,
      commits: mongoose.Schema.Types.Mixed,
    },
    activeConflicts: [mongoose.Schema.Types.Mixed],
    liveResolvedCode: String,
    finalMergedCode: String,
    verificationResult: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: Date,
    completedAt: Date,
    duration: Number, // in seconds
    messageQueue: [mongoose.Schema.Types.Mixed],
  },
  { collection: "rooms" },
);

// Duel History Schema (completed games archive)
const duelHistorySchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    alphaPlayer: {
      userId: mongoose.Schema.Types.ObjectId,
      username: String,
      initialCode: String,
      finalCode: String,
    },
    betaPlayer: {
      userId: mongoose.Schema.Types.ObjectId,
      username: String,
      initialCode: String,
      finalCode: String,
    },
    mergedCode: String,
    conflicts: [
      {
        file: String,
        resolution: String,
      },
    ],
    duration: Number, // in seconds
    completedAt: {
      type: Date,
      default: Date.now,
    },
    verificationPassed: Boolean,
    score: {
      accuracy: Number, // 0-100
      speed: Number, // 0-100
      total: Number, // 0-100
    },
  },
  { collection: "duel_history" },
);

// ==================== Models ====================

const User = mongoose.model("User", userSchema);
const Room = mongoose.model("Room", roomSchema);
const DuelHistory = mongoose.model("DuelHistory", duelHistorySchema);

// ==================== Connection ====================

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected successfully");
    console.log(`📍 Database: ${MONGODB_URI}`);
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("📍 Connection string:", MONGODB_URI);
    return false;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
  } catch (err) {
    console.error("❌ Error disconnecting MongoDB:", err);
  }
}

module.exports = {
  mongoose,
  connectDB,
  disconnectDB,
  User,
  Room,
  DuelHistory,
};
