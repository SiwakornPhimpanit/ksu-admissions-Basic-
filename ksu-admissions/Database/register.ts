import bcrypt from "bcryptjs";
import type { ResultSetHeader } from "mysql2/promise";
import { getDb } from "./db_connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "ข้อมูล JSON ไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { success: false, message: "รูปแบบข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const input = body as Record<string, unknown>;

  if (
    typeof input.name !== "string" ||
    typeof input.email !== "string" ||
    typeof input.password !== "string"
  ) {
    return Response.json(
      { success: false, message: "กรุณากรอกชื่อ อีเมล และรหัสผ่าน" },
      { status: 400 },
    );
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  // ไม่ trim รหัสผ่าน เพราะช่องว่างอาจเป็นส่วนหนึ่งของรหัสผ่านที่ผู้ใช้ตั้งใจกรอก
  const password = input.password;

  if (name.length < 2 || name.length > 100) {
    return Response.json(
      { success: false, message: "ชื่อต้องมีความยาว 2–100 ตัวอักษร" },
      { status: 400 },
    );
  }

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return Response.json(
      { success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return Response.json(
      { success: false, message: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" },
      { status: 400 },
    );
  }

  if (password.length > 72 || Buffer.byteLength(password, "utf8") > 72) {
    return Response.json(
      {
        success: false,
        message:
          "รหัสผ่านต้องมีความยาวไม่เกิน 72 ตัวอักษร และขนาดไม่เกิน 72 ไบต์",
      },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const db = getDb();

    // ใช้ Prepared Statement (Parameter) เพื่อป้องกัน SQL Injection
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name, email, passwordHash],
    );

    return Response.json(
      {
        success: true,
        message: "สมัครสมาชิกสำเร็จ",
        user: {
          id: result.insertId,
          name,
          email,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error as { code?: string; errno?: number; message?: string };

    // รหัส ER_DUP_ENTRY หรือ errno 1062 ของ MySQL สำหรับ Unique Email
    if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) {
      return Response.json(
        { success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 },
      );
    }

    console.error("Registration failed:", error);

    const devErrorMessage =
      err?.message ?? (error instanceof Error ? error.message : String(error));

    return Response.json(
      {
        success: false,
        message: "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
        error: process.env.NODE_ENV === "development" ? devErrorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

// export alias เพื่อให้เรียกใช้ได้ทั้ง POST(req) ตามแบบ Route Handler หรือ register(req)
export { POST as register };