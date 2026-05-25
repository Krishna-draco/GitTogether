import socketService from "./socketService";

export const attachAuthToken = (token) => {
  const socket = socketService.getSocket();
  if (!socket) return;

  // Attach token for future emits and reconnection
  socket.auth = { token };
  // If socket is connected, emit an auth handshake
  if (socket.connected) {
    socket.emit("AUTHENTICATE", { token });
  }
};

export default attachAuthToken;
