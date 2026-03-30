import WebSocket from "ws";

const { WS_URL, API_KEY, VIRTUALDJ_BASE_URL, POLL_INTERVAL: POLL_INTERVAL_STR } = process.env;

const missing = ["WS_URL", "API_KEY", "VIRTUALDJ_BASE_URL", "POLL_INTERVAL"].filter(
  (k) => !process.env[k],
);

if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

const POLL_INTERVAL = parseInt(POLL_INTERVAL_STR, 10) * 1000;

async function fetchVirtualDJInfo() {
  const [artistRes, titleRes] = await Promise.all([
    fetch(`${VIRTUALDJ_BASE_URL}/query?script=deck%20active%20get%20artist`),
    fetch(`${VIRTUALDJ_BASE_URL}/query?script=deck%20active%20get%20title`),
  ]);

  const artist = (await artistRes.text()).trim();
  const title = (await titleRes.text()).trim();

  return { artist, title };
}

function connect() {
  const ws = new WebSocket(`${WS_URL}/push?apiKey=${encodeURIComponent(API_KEY)}`);
  let interval = null;
  let current = { artist: null, title: null };

  ws.on("open", () => {
    console.log("Connected to server");

    interval = setInterval(async () => {
      try {
        const { artist, title } = await fetchVirtualDJInfo();

        if (artist !== current.artist || title !== current.title) {
          current = { artist, title };
          ws.send(JSON.stringify({ artist, title }));
          console.log(`Sent: ${artist} - ${title}`);
        }
      } catch (err) {
        console.error("Failed to fetch VirtualDJ info:", err.message);
      }
    }, POLL_INTERVAL);
  });

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Disconnected, reconnecting in 5s...");
    setTimeout(connect, 5000);
  });

  ws.on("error", (err) => console.error("WebSocket error:", err.code ?? err.message));
}

console.log(`Polling VirtualDJ every ${POLL_INTERVAL / 1000}s`);
connect();
