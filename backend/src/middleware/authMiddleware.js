const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET =
  process.env.JWT_SECRET || "gittogether_fallback_secret_key_123";

// Protect API HTTP Routes
const protect = async (req, res, next) => {
  let token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Not authorized, no token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database, excluding password
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Protect Socket.io Connections
const socketProtect = async (socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    let token = authToken;

    if (!token) {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error("Authentication error: No credentials provided"));
      }

      // Manual cookie parsing since cookie-parser middleware doesn't run automatically on socket connections
      const cookies = {};
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        cookies[parts[0].trim()] = parts[1]
          ? decodeURIComponent(parts[1].trim())
          : "";
      });

      token = cookies.token;
    }

    if (!token) {
      return next(new Error("Authentication error: No token found"));
    }

    // Decode and verify
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user information to socket
    socket.user = user;
    next();
  } catch (error) {
    console.error("Socket Auth Error:", error.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
};

module.exports = { protect, socketProtect };
