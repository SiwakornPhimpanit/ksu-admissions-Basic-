import { createApi } from "./api.js";

const app = createApi(
  (env) => {
    if (!env.DB) {
      throw new Error("DB missing: D1 database binding 'DB' is not configured.");
    }
    const db = env.DB;
    return {
      all: async (sql, args = []) => {
        const params = Array.isArray(args) ? args : args !== undefined ? [args] : [];
        const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
        const result = await stmt.all();
        return result.results ?? [];
      },
      run: async (sql, args = []) => {
        const params = Array.isArray(args) ? args : args !== undefined ? [args] : [];
        const stmt = params.length > 0 ? db.prepare(sql).bind(...params) : db.prepare(sql);
        await stmt.run();
      },
    };
  },
  (env) => env.ADMIN_TOKEN,
);

app.all("*", (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.json({ error: "ไม่พบหน้าที่ต้องการ" }, 404);
});

export default app;


