import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function start() { await connectDatabase(); const server = app.listen(env.PORT, () => console.info(`NexCall API listening on ${env.BACKEND_URL}`)); const shutdown = (signal: string) => { console.info(`${signal} received; shutting down`); server.close(() => { void disconnectDatabase().finally(() => process.exit(0)); }); }; process.on("SIGTERM", () => shutdown("SIGTERM")); process.on("SIGINT", () => shutdown("SIGINT")); }
start().catch((error: unknown) => { console.error("Failed to start NexCall API", error); process.exit(1); });
