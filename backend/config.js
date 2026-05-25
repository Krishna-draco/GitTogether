/**
 * Backend Configuration
 */

const config = {
  // Server
  port: process.env.PORT || 5000,
  host: process.env.HOST || "localhost",
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "*",

  // Socket.io
  socketIO: {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  },

  // Session Management
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT_MS || "120000"),

  // Verification
  verification: {
    minContentRetention: 0.1, // 10% of original content
    enableSyntaxCheck: true,
    enableBracketBalanceCheck: true,
  },

  // Room Management
  maxPlayersPerRoom: 2,
  maxRoomsPerServer: 1000,

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableConsole: true,
    enableFile: false,
  },
};

module.exports = config;
