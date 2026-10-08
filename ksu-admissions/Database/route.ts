import { getDb } from "./db_connect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();

  try {
    const pool = getDb();
    await pool.query("SELECT 1");

    const latencyMs = Date.now() - startTime;

    return Response.json(
      {
        success: true,
        message: "เชื่อมต่อฐานข้อมูลสำเร็จ",
        latency: `${latencyMs}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Database connection error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

    return Response.json(
      {
        success: false,
        message: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ",
        error:
          process.env.NODE_ENV === "development"
            ? errorMessage
            : "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
