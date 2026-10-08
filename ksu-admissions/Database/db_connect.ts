// Note: 'server-only' is omitted so this works in both Node.js runtime and Next.js
import { createPool, type Pool } from "mysql2/promise";

const globalForDb = globalThis as typeof globalThis & {
  mysqlPool?: Pool;
};

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value?.trim()) {
    throw new Error(`กรุณาตั้งค่า ${name} ใน .env.local`);
  }

  return value;
}

function createDbPool(): Pool {
  const port = Number(process.env.DB_PORT ?? "3306");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("DB_PORT ต้องเป็นเลขพอร์ตระหว่าง 1–65535");
  }

  if (process.env.DB_PASSWORD === undefined) {
    throw new Error("กรุณาตั้งค่า DB_PASSWORD ใน .env.local");
  }

  return createPool({
    host: requiredEnv("DB_HOST"),
    port,
    user: requiredEnv("DB_USER"),
    password: process.env.DB_PASSWORD,
    database: requiredEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 50,
    connectTimeout: 10_000,
    charset: "utf8mb4",
  });
}

export function getDb(): Pool {
  if (!globalForDb.mysqlPool) {
    globalForDb.mysqlPool = createDbPool();
  }

  return globalForDb.mysqlPool;
}