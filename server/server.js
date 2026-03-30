import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const { PORT, API_KEY } = process.env;

const missing = ["PORT", "API_KEY"].filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

const server = createServer();
const wss = new WebSocketServer({ noServer: true });
const pullClients = new Set();
let currentInfo = { title: "", artist: "" };

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;

  if (url.searchParams.get("apiKey") !== API_KEY) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  if (path !== "/push" && path !== "/pull") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, path);
  });
});

wss.on("connection", (ws, path) => {
  if (path === "/pull") {
    pullClients.add(ws);
    ws.send(JSON.stringify(currentInfo));
    console.log(`Pull client connected (${pullClients.size} total)`);

    ws.on("close", () => {
      pullClients.delete(ws);
      console.log(`Pull client disconnected (${pullClients.size} remaining)`);
    });
    ws.on("error", () => pullClients.delete(ws));
  } else {
    console.log("Push client connected");

    ws.on("message", (data) => {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        return;
      }

      if (typeof parsed.title !== "string" || typeof parsed.artist !== "string") return;

      currentInfo = { title: parsed.title, artist: parsed.artist };
      const msg = JSON.stringify(currentInfo);

      let sent = 0;
      for (const client of pullClients) {
        if (client.readyState === client.OPEN) {
          client.send(msg);
          sent++;
        }
      }

      console.log(`[${parsed.artist} - ${parsed.title}] → broadcast to ${sent} client(s)`);
    });

    ws.on("close", () => console.log("Push client disconnected"));
    ws.on("error", (err) => console.error("Push client error:", err.code ?? err.message));
  }
});

server.on("error", (err) => {
  console.error("Server error:", err.code ?? err.message);
  process.exit(1);
});

server.listen(parseInt(PORT, 10), () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});
