/**
 * SocketContext — connects once, shared app-wide.
 * Components subscribe to events with useSocket().
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api", "")
  : (process.env.NODE_ENV === "production" ? "" : "http://localhost:5000");

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]); // { action, detail, actor, role, at }

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("notification", (payload) => {
      setNotifications((prev) => [
        { ...payload, id: Date.now() + Math.random() },
        ...prev.slice(0, 49)          // keep last 50
      ]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ notifications, clearAll: () => setNotifications([]) }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
