import { useContext, useEffect, useCallback } from "react";
import { SocketContext } from "../context/SocketContext";

export const useSocket = () => {
  const socket = useContext(SocketContext);

  if (!socket) {
    console.warn("useSocket must be used within SocketProvider");
    return null;
  }

  return socket;
};

export const useSocketEvent = (eventName, callback) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, eventName, callback]);
};

export const useSocketEmit = () => {
  const socket = useSocket();

  return useCallback(
    (eventName, data, callback) => {
      if (!socket) {
        console.error("Socket not initialized");
        return;
      }
      socket.emit(eventName, data, callback);
    },
    [socket],
  );
};
