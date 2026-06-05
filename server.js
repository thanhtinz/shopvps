// Custom Next.js server that also hosts a Socket.IO instance for live ticket
// updates. Sockets only carry a lightweight "this ticket changed" signal —
// clients then refetch via the authenticated REST endpoints, so the socket
// layer never becomes an authorization bypass.
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));
  const io = new Server(server, { cors: { origin: false } });

  // Expose the instance so API route handlers (same process) can emit.
  globalThis.__io = io;

  io.on("connection", (socket) => {
    socket.on("join", (ticketId) => {
      if (typeof ticketId === "string" && ticketId) socket.join(`ticket:${ticketId}`);
    });
    socket.on("leave", (ticketId) => {
      if (typeof ticketId === "string" && ticketId) socket.leave(`ticket:${ticketId}`);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port} (socket.io enabled)`);
  });
});
