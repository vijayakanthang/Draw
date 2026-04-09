import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

interface UseSocketOptions {
  roomId: string | null;
  username: string;
  userId: string;
}

export function useSocket({ roomId, username, userId }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  const getSocket = useCallback(() => socketRef.current, []);

  useEffect(() => {
    if (!roomId) {
      // No room — disconnect any existing socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setStatus("disconnected");
      return;
    }

    // Create socket connection
    const url = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket = io(url, {
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;
    setStatus("connecting");

    socket.on("connect", () => {
      setStatus("connected");
      // Join (or re-join) the room on every connect
      socket.emit("join-room", { roomId, username, userId });
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    socket.on("reconnecting", () => {
      setStatus("reconnecting");
    });

    socket.on("reconnect_attempt", () => {
      setStatus("reconnecting");
    });

    socket.on("reconnect", () => {
      setStatus("connected");
    });

    socket.on("connect_error", () => {
      setStatus("disconnected");
    });

    // If socket is already connected (sync), join immediately
    if (socket.connected) {
      setStatus("connected");
      socket.emit("join-room", { roomId, username, userId });
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setStatus("disconnected");
    };
  }, [roomId, username, userId]);

  return { getSocket, status };
}
