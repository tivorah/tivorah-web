"use client";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { adminApiBase } from "../app/admin/api-base";

// Listens for a server event on the signed-in member's own socket room
// (`user:<id>`, joined by the API from the session cookie). Used for account
// updates that should appear without a refresh, e.g. an accepted ticket transfer.
export function useAccountSocketEvent<T>(eventName: string, onEvent: (payload: T) => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  useEffect(() => {
    const base = adminApiBase();
    if (!base) return;
    const socket = io(base, { withCredentials: true, transports: ["websocket"], reconnectionAttempts: 8 });
    socket.on(eventName, (payload: T) => handler.current(payload));
    return () => { socket.disconnect(); };
  }, [eventName]);
}
