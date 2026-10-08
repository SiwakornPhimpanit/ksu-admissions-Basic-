import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { z } from "zod";
import { programs, sources, officialFeesPdf } from "../src/data.js";
export interface Store {
  all(sql: string, args?: unknown[]): Promise<unknown[]>;
  run(sql: string, args?: unknown[]): Promise<void>;
}

export const applicationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().regex(/^0\d{8,9}$/),
  program: z.enum(["bachelor4", "transfer3", "transfer2", "diploma2"]),
  year: z.number().int().min(2568).max(2569),
  consent: z.literal(true),
});
const documentSchema = z.object({
  title: z.string().trim().min(2).max(160),
  url: z
    .url()
    .max(2048)
    .refine((v) => new URL(v).protocol === "https:", "ต้องใช้ HTTPS"),
  year: z.number().int().min(2565).max(2569),
});
type Env = {
  Bindings: { DB?: D1Database; ADMIN_TOKEN?: string; ASSETS?: Fetcher };
};
export function createApi(
  getStore: (env: Env["Bindings"]) => Store,
  getToken?: (env: Env["Bindings"]) => string | undefined,
) {
  const app = new Hono<Env>();
  app.use(
    "/api/*",
    bodyLimit({
      maxSize: 16384,
      onError: (c) => c.json({ error: "ข้อมูลมีขนาดใหญ่เกินไป" }, 413),
    }),
  );
  app.use("/api/*", async (c, next) => {
    await next();
    c.header("Cache-Control", "no-store");
    c.header("X-Content-Type-Options", "nosniff");
  });
  app.onError((err, c) => {
    console.error(err.message);
    return c.json({ error: "ระบบขัดข้อง กรุณาลองใหม่" }, 500);
  });
  app.get("/api/health", (c) => c.json({ ok: true }));
  app.get("/api/programs", (c) => c.json(programs));
  app.post("/api/applications", async (c) => {
    const parsed = applicationSchema.safeParse(
      await c.req.json().catch(() => null),
    );
    if (!parsed.success)
      return c.json(
        { error: "กรุณาตรวจสอบชื่อ อีเมล เบอร์โทร และความยินยอม" },
        400,
      );
    const p = parsed.data,
      id = crypto.randomUUID();
    await getStore(c.env).run(
      "INSERT INTO applications (id,name,email,phone,program,year) VALUES (?,?,?,?,?,?)",
      [id, p.name, p.email, p.phone, p.program, p.year],
    );
    return c.json({ id, status: "received" }, 201);
  });
  app.get("/api/documents", async (c) =>
    c.json(
      await getStore(c.env).all(
        "SELECT id,title,url,year FROM documents ORDER BY created_at DESC",
      ),
    ),
  );
  app.use("/api/admin/*", async (c, next) => {
    const token = getToken?.(c.env) ?? c.env.ADMIN_TOKEN;
    if (!token || token.length < 32)
      return c.json({ error: "ยังไม่ได้ตั้งค่าผู้ดูแล" }, 503);
    if (c.req.header("Authorization") !== `Bearer ${token}`)
      return c.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, 401);
    await next();
  });
  app.get("/api/admin/applications", async (c) =>
    c.json(
      await getStore(c.env).all(
        "SELECT * FROM applications ORDER BY created_at DESC LIMIT 500",
      ),
    ),
  );
  app.post("/api/admin/documents", async (c) => {
    const p = documentSchema.safeParse(await c.req.json().catch(() => null));
    if (!p.success)
      return c.json({ error: "ชื่อเอกสาร ปี หรือ HTTPS URL ไม่ถูกต้อง" }, 400);
    const id = crypto.randomUUID();
    await getStore(c.env).run(
      "INSERT INTO documents (id,title,url,year) VALUES (?,?,?,?)",
      [id, p.data.title, p.data.url, p.data.year],
    );
    return c.json({ id }, 201);
  });
  app.patch("/api/admin/applications/:id", async (c) => {
    const p = z
      .object({
        status: z.enum(["received", "reviewing", "accepted", "rejected"]),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!p.success) return c.json({ error: "สถานะไม่ถูกต้อง" }, 400);
    const existing = await getStore(c.env).all("SELECT id FROM applications WHERE id=?", [c.req.param("id")]);
    if (!existing.length) return c.json({ error: "ไม่พบคำขอสมัคร" }, 404);
    await getStore(c.env).run("UPDATE applications SET status=? WHERE id=?", [
      p.data.status,
      c.req.param("id"),
    ]);
    return c.json({ ok: true });
  });
  app.post("/api/chat", async (c) => {
    const p = z
      .object({
        session: z.uuid(),
        message: z.string().trim().min(1).max(1000),
      })
      .safeParse(await c.req.json().catch(() => null));
    if (!p.success) return c.json({ error: "ข้อความไม่ถูกต้อง" }, 400);
    const { message, session } = p.data;
    const rows = await getStore(c.env).all(
      "SELECT id FROM messages WHERE session=? AND role='user' AND created_at > datetime('now','-1 minute') LIMIT 20",
      [session],
    );
    if (rows.length >= 20)
      return c.json({ error: "กรุณารอสักครู่ก่อนส่งข้อความเพิ่ม" }, 429);
    let reply =
      "สอบถามหลักสูตร ค่าเทอม ปฏิทิน หรือเอกสาร PDF ได้ค่ะ หากต้องการข้อมูลยืนยัน ติดต่อสำนักส่งเสริมวิชาการและงานทะเบียนผ่าน " +
      sources.calendar;
    if (/ค่า|เทอม|เงิน/.test(message))
      reply =
        "บัญชีสถานะหลักสูตรมหาวิทยาลัย: วิศวกรรมหลายสาขา 10,200 บาท/ภาคเรียน; อส.บ. เครื่องจักรกลเกษตร 8,700; นวัตกรรมการออกแบบ 10,800; ปวส. หลายสาขา 5,700 และดิจิทัลกราฟิก 4,700 บาท/ภาคเรียน ใช้วางแผนงบปี 2565–2569 ได้ แต่ยังไม่ใช่อัตรายืนยันรายปี ดู " +
        officialFeesPdf;
    else if (/ปฏิทิน|เปิดเทอม|2568|2569/.test(message))
      reply =
        "ปฏิทินปี 2568–2569 ต้องเลือกตามระดับและกลุ่มนักศึกษา ดูประกาศทางการ " +
        sources.calendar;
    else if (/หลักสูตร|เทียบโอน|ปวส/.test(message))
      reply =
        "เว็บนี้แสดงเส้นทาง 4 ปี เทียบโอน 3 ปี เทียบโอน 2 ปี และ ปวส. 2 ปี ระยะเวลาจริงและสาขาที่เปิดรับต้องตรวจสอบ " +
        sources.programs;
    else if (/PDF|pdf|เอกสาร/.test(message))
      reply =
        "เปิดแท็บเอกสารเพื่อดู PDF ผู้ดูแลสามารถเพิ่ม HTTPS ลิงก์ได้ หรือวางลิงก์ PDF ในแชทเพื่อเปิดเอกสาร ระบบไม่ได้อ่านเนื้อหา PDF อัตโนมัติ";
    await getStore(c.env).run(
      "INSERT INTO messages (id,session,role,body) VALUES (?,?,?,?)",
      [crypto.randomUUID(), session, "user", message],
    );
    await getStore(c.env).run(
      "INSERT INTO messages (id,session,role,body) VALUES (?,?,?,?)",
      [crypto.randomUUID(), session, "assistant", reply],
    );
    return c.json({ reply });
  });
  app.all("/api/*", (c) => c.json({ error: "ไม่พบ API" }, 404));
  return app;
}
