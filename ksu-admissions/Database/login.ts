import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2/promise";
import { getDb } from "./db_connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

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

  if (typeof input.email !== "string" || typeof input.password !== "string") {
    return Response.json(
      { success: false, message: "กรุณากรอกอีเมลและรหัสผ่าน" },
      { status: 400 },
    );
  }

  const email = input.email.trim().toLowerCase();
  // ไม่ trim รหัสผ่าน เพราะช่องว่างอาจเป็นส่วนหนึ่งของรหัสผ่านที่ผู้ใช้ตั้งใจกรอก
  const password = input.password;

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  if (password.length === 0) {
    return Response.json(
      { success: false, message: "กรุณากรอกรหัสผ่าน" },
      { status: 400 },
    );
  }

  try {
    const db = getDb();

    // ใช้ Prepared Statement เพื่อป้องกัน SQL Injection
    const [rows] = await db.execute<UserRow[]>(
      "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email],
    );

    const user = rows[0];

    // ใช้เวลาเท่ากันไม่ว่าจะพบ user หรือไม่ เพื่อป้องกัน Timing Attack
    const dummyHash =
      "$2b$12$invalidhashforcomparison000000000000000000000000000000";
    const isValid = await bcrypt.compare(
      password,
      user?.password_hash ?? dummyHash,
    );

    if (!user || !isValid) {
      return Response.json(
        { success: false, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    return Response.json(
      {
        success: true,
        message: "เข้าสู่ระบบสำเร็จ",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Login failed:", error);

    const devErrorMessage =
      error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        error:
          process.env.NODE_ENV === "development" ? devErrorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

// export alias เพื่อให้เรียกใช้ได้ทั้ง POST(req) ตามแบบ Route Handler หรือ login(req)
export { POST as login };