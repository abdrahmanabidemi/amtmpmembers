import { createApp } from "./app.js";
import { config } from "./config.js";
import { getDb } from "./db/index.js";
import { seedInitialData } from "./db/seed.js";

async function startServer() {
  try {
    // Ensure database client is ready
    await getDb();
    // Seed initial baseline admin and member if not yet seeded
    await seedInitialData();

    const app = createApp();
    app.listen(config.port, () => {
      console.log(`[AMTMP Server] Running on http://localhost:${config.port} (${config.env})`);
    });
  } catch (err) {
    console.error("[AMTMP Server] Failed to start:", err);
    process.exit(1);
  }
}

startServer();
