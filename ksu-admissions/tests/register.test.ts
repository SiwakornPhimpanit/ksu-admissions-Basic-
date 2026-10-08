import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../Database/register.js";

type ApiResponse = {
  success: boolean;
  message: string;
  user?: { id: number; name: string; email: string };
  error?: string;
};

function createMockRequest(body: unknown): Request {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("rejects invalid JSON", async () => {
  const req = new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "invalid json string",
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = (await res.json()) as ApiResponse;
  assert.equal(data.success, false);
  assert.equal(data.message, "ข้อมูล JSON ไม่ถูกต้อง");
});

test("rejects non-object body", async () => {
  const req = createMockRequest(["not", "an", "object"]);
  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = (await res.json()) as ApiResponse;
  assert.equal(data.success, false);
  assert.equal(data.message, "รูปแบบข้อมูลไม่ถูกต้อง");
});

test("rejects missing fields", async () => {
  const req = createMockRequest({ name: "User" });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = (await res.json()) as ApiResponse;
  assert.equal(data.success, false);
  assert.equal(data.message, "กรุณากรอกชื่อ อีเมล และรหัสผ่าน");
});

test("rejects short or overly long name", async () => {
  const reqShort = createMockRequest({
    name: "A",
    email: "test@example.com",
    password: "password123",
  });
  const resShort = await POST(reqShort);
  assert.equal(resShort.status, 400);
  const dataShort = (await resShort.json()) as ApiResponse;
  assert.equal(dataShort.message, "ชื่อต้องมีความยาว 2–100 ตัวอักษร");

  const reqLong = createMockRequest({
    name: "A".repeat(101),
    email: "test@example.com",
    password: "password123",
  });
  const resLong = await POST(reqLong);
  assert.equal(resLong.status, 400);
  const dataLong = (await resLong.json()) as ApiResponse;
  assert.equal(dataLong.message, "ชื่อต้องมีความยาว 2–100 ตัวอักษร");
});

test("rejects invalid email formats", async () => {
  const req = createMockRequest({
    name: "Valid Name",
    email: "not-an-email",
    password: "password123",
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = (await res.json()) as ApiResponse;
  assert.equal(data.message, "รูปแบบอีเมลไม่ถูกต้อง");
});

test("rejects short passwords (< 8 chars)", async () => {
  const req = createMockRequest({
    name: "Valid Name",
    email: "test@example.com",
    password: "short",
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = (await res.json()) as ApiResponse;
  assert.equal(data.message, "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
});

test("rejects passwords > 72 chars or > 72 bytes", async () => {
  const req = createMockRequest({
    name: "Valid Name",
    email: "test@example.com",
    password: "a".repeat(73),
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = (await res.json()) as ApiResponse;
  assert.equal(
    data.message,
    "รหัสผ่านต้องมีความยาวไม่เกิน 72 ตัวอักษร และขนาดไม่เกิน 72 ไบต์",
  );
});
