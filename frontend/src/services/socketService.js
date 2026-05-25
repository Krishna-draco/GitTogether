import io from "socket.io-client";
import { SOCKET_URL } from "../utils/constants";

let socketInstance = null;

export const socketService = {
  // Initialize socket connection
  connect: (options = {}) => {
    if (socketInstance && socketInstance.connected) {
      return socketInstance;
    }

    socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      ...options,
    });

    return socketInstance;
  },

  // Get socket instance
  getSocket: () => {
    if (!socketInstance) {
      console.warn("Socket not connected. Call connect() first.");
    }
    return socketInstance;
  },

  // Disconnect socket
  disconnect: () => {
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  },

  // Check if connected
  isConnected: () => {
    return socketInstance && socketInstance.connected;
  },

  // Emit event
  emit: (event, data, callback) => {
    if (!socketInstance) {
      console.error("Socket not initialized");
      return;
    }
    socketInstance.emit(event, data, callback);
  },

  // Listen to event
  on: (event, callback) => {
    if (!socketInstance) {
      console.error("Socket not initialized");
      return;
    }
    socketInstance.on(event, callback);
  },

  // Remove event listener
  off: (event, callback) => {
    if (!socketInstance) return;
    socketInstance.off(event, callback);
  },

  // Listen once
  once: (event, callback) => {
    if (!socketInstance) {
      console.error("Socket not initialized");
      return;
    }
    socketInstance.once(event, callback);
  },
};

export default socketService;
