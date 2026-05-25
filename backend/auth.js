const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("./database");
const dotenv = require("dotenv");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "devduel_secret";
const TOKEN_EXPIRY = "7d";

async function findUserByUsername(username) {
  return await User.findOne({ username: username.toLowerCase() });
}

async function registerUser({ username, password, displayName }) {
  if (!username || !password) throw new Error("Missing username or password");

  const existingUser = await findUserByUsername(username);
  if (existingUser) {
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(8);
  const hash = await bcrypt.hash(password, salt);

  const newUser = new User({
    username: username.toLowerCase(),
    passwordHash: hash,
    displayName: displayName || username,
  });

  await newUser.save();

  return {
    id: newUser._id.toString(),
    username: newUser.username,
    displayName: newUser.displayName,
  };
}

async function authenticateUser({ username, password }) {
  const user = await findUserByUsername(username);
  if (!user) throw new Error("Invalid credentials");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  );

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName,
    },
    token,
  };
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = {
  registerUser,
  authenticateUser,
  verifyToken,
  findUserByUsername,
};
