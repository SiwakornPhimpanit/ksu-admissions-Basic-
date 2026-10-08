import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { existsSync, readFileSync } from "node:fs";
import { createApi } from "../server/api.js";
const db = new Database(":memory:");
const sqlPath = existsSync("migrations/0001_init.sql")
  ? "migrations/0001_init.sql"
  : "Database/0001_init.sql";
db.exec(readFileSync(sqlPath, "utf8"));
const token = "a-test-secret-that-is-over-32-characters";
const app = createApi(
  () => ({
    all: async (sql, args = []) => db.prepare(sql).all(...args),
    run: async (sql, args = []) => {
      db.prepare(sql).run(...args);
    },
  }),
  () => token,
);
function post(path: string, data: unknown, admin = false) {
  return app.request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(admin ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(data),
  });
}
test("reject invalid application and require consent", async () => {
  const res = await post("/api/applications", { name: "A" });
  assert.equal(res.status, 400);
  assert.equal(
    db.prepare("SELECT COUNT(*) n FROM applications").get() &&
      (db.prepare("SELECT COUNT(*) n FROM applications").get() as { n: number })
        .n,
    0,
  );
});
test("persist application and protect applicant data", async () => {
  const res = await post("/api/applications", {
    name: "Test Student",
    email: "student@example.com",
    phone: "0812345678",
    program: "bachelor4",
    year: 2569,
    consent: true,
  });
  assert.equal(res.status, 201);
  const data = (await res.json()) as { id: string };
  assert.ok(db.prepare("SELECT * FROM applications WHERE id=?").get(data.id));
  assert.equal((await app.request("/api/admin/applications")).status, 401);
  assert.equal(
    (
      await app.request("/api/admin/applications", {
        headers: { Authorization: "Bearer " + token },
      })
    ).status,
    200,
  );
});
test("admin documents reject dangerous URL and persist HTTPS PDF link", async () => {
  assert.equal(
    (
      await post(
        "/api/admin/documents",
        { title: "bad", url: "javascript:alert(1)", year: 2569 },
        true,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await post(
        "/api/admin/documents",
        {
          title: "Calendar",
          url: "https://example.com/calendar.pdf",
          year: 2569,
        },
        true,
      )
    ).status,
    201,
  );
  const docs = (await (
    await app.request("/api/documents")
  ).json()) as unknown[];
  assert.equal(docs.length, 1);
});
test("chat stores both messages and rejects oversized input", async () => {
  const session = crypto.randomUUID();
  const res = await post("/api/chat", { session, message: "ค่าเทอม" });
  assert.equal(res.status, 200);
  assert.match(((await res.json()) as { reply: string }).reply, /10,200/);
  assert.equal(
    (
      db
        .prepare("SELECT COUNT(*) n FROM messages WHERE session=?")
        .get(session) as { n: number }
    ).n,
    2,
  );
  assert.equal(
    (await post("/api/chat", { session, message: "x".repeat(1001) })).status,
    400,
  );
});
test("status update returns 404 for missing application", async () => {
  const response = await app.request("/api/admin/applications/" + crypto.randomUUID(), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ status: "reviewing" }),
  });
  assert.equal(response.status, 404);
});
test("chat throttles after 20 user messages in one minute", async () => {
  const session = crypto.randomUUID();
  const insert = db.prepare("INSERT INTO messages (id,session,role,body) VALUES (?,?,?,?)");
  for (let i = 0; i < 20; i++) insert.run(crypto.randomUUID(), session, "user", "test");
  const response = await post("/api/chat", { session, message: "ค่าเทอม" });
  assert.equal(response.status, 429);
});
