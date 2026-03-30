import { writeFile } from "node:fs/promises";
import WebSocket from "ws";

const { WS_URL, API_KEY, OUTPUT_FILE } = process.env;

const missing = ["WS_URL", "API_KEY", "OUTPUT_FILE"].filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

function connect() {
  const ws = new WebSocket(`${WS_URL}/pull?apiKey=${encodeURIComponent(API_KEY)}`);

  ws.on("open", () => {
    console.log("Connected to server, waiting for updates...");
  });

  ws.on("message", async (data) => {
    const { title, artist } = JSON.parse(data);
    const content = `${artist} - ${title}`;
    console.log(`Received: ${content}`);
    try {
      await writeFile(OUTPUT_FILE, content, "utf8");
    } catch (err) {
      console.error("Failed to write output file:", err.message);
    }
  });

  ws.on("close", () => {
    console.log("Disconnected, reconnecting in 5s...");
    setTimeout(connect, 5000);
  });

  ws.on("error", (err) => console.error("WebSocket error:", err.code ?? err.message));
}

connect();
