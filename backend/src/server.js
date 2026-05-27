const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { socketProtect } = require('./middleware/authMiddleware');
const handleSockets = require('./sockets/socketHandler');

// Initialize database connection
connectDB();

const app = express();
const server = http.createServer(app);

// CORS configuration (Enable credentials for Cookie authentication)
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendURL,
    credentials: true,
  })
);

// Body and Cookie parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount API HTTP routes
app.use('/api/auth', authRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.send('GitTogether API is running smoothly...');
});

// Configure Socket.io server
const io = socketio(server, {
  cors: {
    origin: frontendURL,
    credentials: true,
  },
});

// Attach Socket Auth Middleware
io.use(socketProtect);

// Bind Socket.io events
handleSockets(io);

// Server startup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
