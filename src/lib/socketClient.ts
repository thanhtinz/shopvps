"use client";
import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

// Lazily create a single shared socket connection for the browser tab.
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ transports: ["websocket", "polling"], autoConnect: true });
  }
  return socket;
}
