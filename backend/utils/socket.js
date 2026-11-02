/**
 * socket.js — one shared Socket.IO server instance.
 * Import `getIO()` in controllers to emit events.
 */
let _io = null;

function init(httpServer) {
  const { Server } = require("socket.io");
  _io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  _io.on("connection", (socket) => {
    console.log("[socket] client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("[socket] client disconnected:", socket.id);
    });
  });

  return _io;
}

function getIO() {
  if (!_io) throw new Error("Socket.IO has not been initialised yet");
  return _io;
}

module.exports = { init, getIO };
