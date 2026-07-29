// Custom Node server: boots Next.js and attaches Socket.IO to the SAME HTTP
// server so HTTP and WebSocket traffic share one origin and one port. This is
// what lets the whole app run as a single Railway service.
const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer);

  // Realtime wiring is isolated in ./server/realtime.js so this entry file stays
  // focused on the HTTP + Socket.IO handshake.
  require("./server/realtime")(io);

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (dev=${dev})`);
  });
});
