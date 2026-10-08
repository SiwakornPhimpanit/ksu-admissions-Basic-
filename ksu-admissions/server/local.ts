import "dotenv/config";
import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createApi } from "./api.js";

mkdirSync("data", { recursive: true });
const db = new Database("data/admissions.sqlite");
db.pragma("journal_mode = WAL");

const migrationsDir = existsSync("migrations")
  ? "migrations"
  : existsSync("Database")
    ? "Database"
    : null;

if (migrationsDir) {
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    db.exec(sql);
  }
}

const app = createApi(
  () => ({
    all: async (sql, args = []) => {
      const stmt = db.prepare(sql);
      return Array.isArray(args) ? stmt.all(...args) : stmt.all(args);
    },
    run: async (sql, args = []) => {
      const stmt = db.prepare(sql);
      if (Array.isArray(args)) {
        stmt.run(...args);
      } else {
        stmt.run(args);
      }
    },
  }),
  () => process.env.ADMIN_TOKEN,
);

if (existsSync("./dist")) {
  app.use("/*", serveStatic({ root: "./dist" }));
  if (existsSync("./dist/index.html")) {
    app.get("*", serveStatic({ path: "./dist/index.html" }));
  }
}

const port = Number(process.env.PORT) || 3001;
const hostname = process.env.HOST ?? "127.0.0.1";

serve(
  {
    fetch: app.fetch,
    port,
    hostname,
  },
  () => console.log(`API http://${hostname}:${port}`),
);

process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  db.close();
  process.exit(0);
});
