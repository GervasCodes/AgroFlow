// Entry point -- starts the HTTP server (and Socket.IO for realtime
// order/match updates, wired in once the Marketplace domain exists).
// Keep this file thin; app.ts owns wiring.
import { createApp } from "./app.js";
import { getEnv } from "./config/index.js";

const env = getEnv();
const app = createApp();

app.listen(env.PORT, () => {
  console.log(`AgroFlow API listening on port ${env.PORT} (${env.NODE_ENV})`);
});
