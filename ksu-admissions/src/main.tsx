import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  programs,
  feeYears,
  feeReference,
  sources,
  officialFeesPdf,
  calendarPdfs,
  feeDetails,
} from "./data";
import Home from "./page";
import "./styles.css";
type Doc = { id: string; title: string; url: string; year: number };
type Application = {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  status: string;
};
async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "ไม่สามารถเชื่อมต่อระบบ");
  return data;
}
function LinkedMessage({ text }: { text: string }) {
  return <>{text.split(/(https:\/\/[^\s]+)/g).map((part, index) =>
    part.startsWith("https://") ? <a key={index} href={part} target="_blank" rel="noreferrer">เปิดลิงก์เอกสาร ↗</a> : part
  )}</>;
}
function App() {
  const [tab, setTab] = useState("home"),
    [year, setYear] = useState(2569),
    [program, setProgram] = useState("bachelor4"),
    [rate, setRate] = useState(feeReference),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [docs, setDocs] = useState<Doc[]>([]),
    [chat, setChat] = useState(false),
    [message, setMessage] = useState(""),
    [messages, setMessages] = useState([
      {
        role: "assistant",
        body: "สวัสดีค่ะ สอบถามเรื่องหลักสูตร ค่าเทอม และปฏิทินได้เลย • ผู้ช่วยตอบอัตโนมัติจากข้อมูลที่กำหนดไว้",
      },
    ]),
    [token, setToken] = useState(""),
    [apps, setApps] = useState<Application[]>([]);
  const [session] = useState(() => crypto.randomUUID());
  const selected = programs.find((p) => p.id === program)!;
  useEffect(() => {
    setRate(program === "diploma2" ? 5700 : feeReference);
  }, [program]);
  useEffect(() => {
    api<Doc[]>("/documents")
      .then(setDocs)
      .catch((e) => setNotice(e.message));
  }, []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !message.trim()) return;
    const text = message;
    setMessage("");
    setMessages((m) => [...m, { role: "user", body: text }]);
    setBusy(true);
    try {
      const data = await api<{ reply: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({ session, message: text }),
      });
      setMessages((m) => [...m, { role: "assistant", body: data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", body: (e as Error).message },
      ]);
    } finally {
      setBusy(false);
    }
  }
  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      values = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      const result = await api<{ id: string }>("/applications", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          program,
          year,
          consent: values.consent === "on",
        }),
      });
      setNotice(
        "บันทึกคำขอแล้ว เลขอ้างอิง: " +
          result.id +
          " กรุณาเก็บไว้ • เป็นคำขอในระบบต้นแบบ ไม่ใช่การยืนยันสิทธิ์มหาวิทยาลัย",
      );
      form.reset();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function loadAdmin() {
    try {
      setApps(
        await api<Application[]>("/admin/applications", {
          headers: { Authorization: "Bearer " + token },
        }),
      );
      setNotice("โหลดรายการเรียบร้อย");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  async function addDoc(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      values = Object.fromEntries(new FormData(form));
    try {
      await api("/admin/documents", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: JSON.stringify({ ...values, year: Number(values.year) }),
      });
      setDocs(await api<Doc[]>("/documents"));
      form.reset();
      setNotice("เพิ่มลิงก์เอกสารแล้ว");
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  return (
    <>
      <header>
        <a className="brand" href="#" onClick={() => setTab("home")}>
          <span className="seal">K</span>
          <span>
            KSU <b>ADMISSIONS</b>
            <small>มหาวิทยาลัยกาฬสินธุ์</small>
          </span>
        </a>
        <nav aria-label="เมนูหลัก">
          {[
            ["home", "หน้าหลัก"],
            ["programs", "หลักสูตร & ค่าเทอม"],
            ["calendar", "ปฏิทินการศึกษา"],
            ["documents", "เอกสาร PDF"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="primary" onClick={() => setTab("apply")}>
          เริ่มสมัครเรียน ↗
        </button>
      </header>
      <main>
        {notice && (
          <div role="status" className="notice">
            {notice}
            <button onClick={() => setNotice("")} aria-label="ปิดข้อความ">
              ×
            </button>
          </div>
        )}
        {tab === "home" && (
          <Home
            onNavigate={(t) => {
              setProgram(
                t === "programs" ? program : program,
              );
              setTab(t);
            }}
            onOpenChat={() => setChat(true)}
          />
        )}
        {tab === "programs" && (
          <section className="section">
            <span className="eyebrow dark">PROGRAMS & TUITION</span>
            <h1 className="page-title">หลักสูตรและค่าเล่าเรียน</h1>
            <p>
              เส้นทางการศึกษาเป็นหมวดสำหรับค้นหา
              ระยะเวลาเทียบโอนจริงขึ้นกับผลเทียบรายวิชาและหลักสูตรที่เปิดรับ
            </p>
            <div className="cards">
              {programs.map((p) => (
                <button
                  className={
                    "program-card " + (program === p.id ? "selected" : "")
                  }
                  key={p.id}
                  onClick={() => setProgram(p.id)}
                >
                  <span className="icon">{p.icon}</span>
                  <h3>{p.title}</h3>
                  <p>{p.qualification}</p>
                </button>
              ))}
            </div>
            <div className="panel">
              <h2>อัตราภาคปกติจากบัญชีสถานะหลักสูตรปี 2568</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>สาขา</th>
                      <th>บาท/ภาคเรียน</th>
                      <th>บาท/ปี (2 ภาคเรียน)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeDetails.map((f) => (
                      <tr key={f.name}>
                        <td>{f.name}</td>
                        <td>{f.semester.toLocaleString()}</td>
                        <td>{(f.semester * 2).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                ไม่รวมภาคพิเศษและค่าใช้จ่ายอื่น
                อัตราเทียบโอนต้องตรวจสอบประกาศของแผนที่สมัคร
              </p>
            </div>
            <div className="split">
              <div className="panel">
                <h2>ค่าเทอมย้อนหลัง 2565–2569</h2>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ปีการศึกษา</th>
                        <th>งบประมาณ/ภาคเรียน</th>
                        <th>สถานะข้อมูลรายปี</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeYears.map((y) => (
                        <tr key={y}>
                          <td>{y}</td>
                          <td>{program === "diploma2" ? "4,700–5,700" : "8,700–10,800"} บาท</td>
                          <td>
                            {y === 2568 ? "มีบัญชีหลักสูตรอ้างอิง แยกตามสาขาด้านบน" : `ค่าประมาณโดยใช้อัตราปี 2568 • ยังไม่ยืนยันประกาศปี ${y}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  ตารางนี้ใช้วางแผนงบประมาณเท่านั้น ไม่ใช่ประวัติค่าเทอมจริงของแต่ละปี
                  ช่วงราคาเป็นภาพรวมคณะ ให้เลือกอัตราของสาขาตามตารางด้านบน
                  <br />
                  อัตราอ้างอิงที่พบในระบบรับสมัครสำหรับวิศวกรรมบางสาขา: 10,200
                  บาท/ภาคเรียน ไม่ถือเป็นอัตรายืนยันของทุกหลักสูตรหรือทุกปี
                  ไม่ใช้แทนอัตรา ปวส.
                </p>
                <a href={officialFeesPdf} target="_blank" rel="noreferrer">
                  ตรวจสอบแหล่งค่าเทอม ↗
                </a>
              </div>
              <div className="panel calculator">
                <h2>ประมาณงบการศึกษา</h2>
                <label>
                  ค่าเทอมต่อภาคเรียนที่ต้องการใช้ (บาท)
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    value={rate}
                    onChange={(e) =>
                      setRate(Math.max(0, Number(e.target.value)))
                    }
                  />
                </label>
                <small>
                  สมมติ 2 ภาคเรียน/ปี ไม่รวมฤดูร้อนและค่าใช้จ่ายอื่น สำหรับ ปวส.
                  ค่าเริ่มต้น 5,700 บาท/ภาคเรียน ปรับตามสาขาที่สมัครได้
                </small>
                <div className="amount">
                  {(rate * 2).toLocaleString()}
                  <small>บาท / ปี</small>
                </div>
                <p>
                  {selected.title}: รวมประมาณ{" "}
                  <b>{(rate * 2 * selected.years).toLocaleString()} บาท</b>
                </p>
                <button className="primary" onClick={() => setTab("apply")}>
                  กรอกคำขอสมัคร ↗
                </button>
              </div>
            </div>
          </section>
        )}
        {tab === "calendar" && (
          <section className="section">
            <span className="eyebrow dark">ACADEMIC CALENDAR</span>
            <h1 className="page-title">ปฏิทินการศึกษา</h1>
            <div className="split">
              {[2568, 2569].map((y) => (
                <article className="panel" key={y}>
                  <span className="pill">ปีการศึกษา</span>
                  <h2 className="calendar-year">{y}</h2>
                  <p>
                    เลือกปฏิทินตามระดับ ปวส. / ปริญญาตรี
                    และกลุ่มนักศึกษาจากประกาศมหาวิทยาลัย
                  </p>
                  <p>
                    {y === 2569
                      ? "ภาคปกติ: เปิดภาค 1 วันที่ 22 มิถุนายน 2569 • เปิดภาค 2 วันที่ 9 พฤศจิกายน 2569 • สอบปลายภาค 1 วันที่ 12–16 ตุลาคม 2569 • สอบปลายภาค 2 วันที่ 1–5 มีนาคม 2570"
                      : "ดูวันที่ใน PDF ฉบับปรับปรุง โดยเลือกหน้าระดับการศึกษาของตนเอง"}
                  </p>
                  <a
                    className="primary link-button"
                    href={calendarPdfs[y]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    เปิด PDF ปฏิทิน ↗
                  </a>
                </article>
              ))}
            </div>
            <p>
              <a href={sources.calendar} target="_blank" rel="noreferrer">
                งานทะเบียนและประมวลผล ↗
              </a>{" "}
              • ผู้ดูแลเพิ่ม PDF ปฏิทินที่ตรวจสอบแล้วได้ในแท็บเอกสาร
            </p>
          </section>
        )}
        {tab === "documents" && (
          <section className="section">
            <span className="eyebrow dark">DOCUMENT CENTER</span>
            <h1 className="page-title">เอกสารและประกาศ PDF</h1>
            <p>เปิดลิงก์เอกสารในแท็บใหม่ กรุณาตรวจสอบเจ้าของเอกสารก่อนใช้งาน</p>
            {docs.length ? (
              docs.map((d) => (
                <a
                  className="document"
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  key={d.id}
                >
                  <span className="icon">PDF</span>
                  <span>
                    <b>{d.title}</b>
                    <small>ปีการศึกษา {d.year}</small>
                  </span>
                  <span>↗</span>
                </a>
              ))
            ) : (
              <div className="panel">
                ยังไม่มี PDF ที่ผู้ดูแลแนบไว้{" "}
                <a href={sources.calendar} target="_blank" rel="noreferrer">
                  ดูประกาศมหาวิทยาลัย ↗
                </a>
              </div>
            )}
          </section>
        )}
        {tab === "apply" && (
          <section className="section narrow">
            <span className="eyebrow dark">START YOUR JOURNEY</span>
            <h1 className="page-title">คำขอสมัครเรียน</h1>
            <p>
              ระบบต้นแบบนี้บันทึกคำขอเพื่อการทดสอบ
              การสมัครจริงต้องดำเนินการผ่านระบบมหาวิทยาลัย
            </p>
            <form className="panel form" onSubmit={apply}>
              <label>
                ชื่อ–นามสกุล
                <input name="name" required minLength={2} maxLength={120} />
              </label>
              <label>
                อีเมล
                <input type="email" name="email" required maxLength={200} />
              </label>
              <label>
                เบอร์โทรศัพท์
                <input
                  name="phone"
                  inputMode="tel"
                  pattern="0[0-9]{8,9}"
                  required
                  placeholder="08xxxxxxxx"
                />
              </label>
              <label>
                เส้นทางการศึกษา
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                ปีการศึกษา
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  <option>2568</option>
                  <option>2569</option>
                </select>
              </label>
              <label className="checkbox">
                <input type="checkbox" name="consent" required />
                ยินยอมให้จัดเก็บชื่อ อีเมล และโทรศัพท์เพื่อดำเนินคำขอในระบบนี้
                ผู้ดูแลเข้าถึงข้อมูลได้ ไม่ควรกรอกข้อมูลจริงในระบบทดสอบ
              </label>
              <button disabled={busy} className="primary">
                {busy ? "กำลังบันทึก…" : "บันทึกคำขอ →"}
              </button>
              <a href={sources.programs} target="_blank" rel="noreferrer">
                ไปยังระบบรับสมัครมหาวิทยาลัย ↗
              </a>
            </form>
          </section>
        )}
        {tab === "admin" && (
          <section className="section">
            <h1 className="page-title">ผู้ดูแลระบบ</h1>
            <div className="panel form">
              <label>
                Admin token
                <input
                  type="password"
                  value={token}
                  autoComplete="off"
                  onChange={(e) => setToken(e.target.value)}
                />
              </label>
              <button className="primary" onClick={loadAdmin}>
                โหลดคำขอสมัคร
              </button>
            </div>
            <h2>เพิ่มลิงก์ PDF</h2>
            <form className="panel form" onSubmit={addDoc}>
              <input name="title" placeholder="ชื่อเอกสาร" required />
              <input
                name="url"
                type="url"
                placeholder="https://…/document.pdf"
                required
              />
              <select name="year">
                {feeYears.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
              <button className="primary">เพิ่มเอกสาร</button>
            </form>
            <h2>คำขอสมัคร</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ชื่อ</th>
                    <th>ติดต่อ</th>
                    <th>หลักสูตร</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>
                        {a.email}
                        <br />
                        {a.phone}
                      </td>
                      <td>{a.program}</td>
                      <td>
                        <select
                          value={a.status}
                          onChange={async (e) => {
                            try {
                              await api("/admin/applications/" + a.id, {
                                method: "PATCH",
                                headers: { Authorization: "Bearer " + token },
                                body: JSON.stringify({
                                  status: e.target.value,
                                }),
                              });
                              await loadAdmin();
                            } catch (err) {
                              setNotice((err as Error).message);
                            }
                          }}
                        >
                          {[
                            "received",
                            "reviewing",
                            "accepted",
                            "rejected",
                          ].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <footer>
        <div className="brand">
          KSU ADMISSIONS
          <small>สำนักส่งเสริมวิชาการและงานทะเบียน มหาวิทยาลัยกาฬสินธุ์</small>
        </div>
        <span>ระบบต้นแบบ • ข้อมูลตรวจสอบ 3 ตุลาคม 2569</span>
        <button className="text-button" onClick={() => setTab("admin")}>
          ผู้ดูแลระบบ
        </button>
      </footer>
      <button
        className="chat-toggle"
        onClick={() => setChat(!chat)}
        aria-label="เปิดแชท"
      >
        {chat ? "×" : "✦ แชทกับผู้ช่วย"}
      </button>
      {chat && (
        <aside className="chat-panel" aria-label="แชทผู้ช่วย">
          <div className="chat-heading">
            <b>✦ KSU Assistant</b>
            <button onClick={() => setChat(false)} aria-label="ปิดแชท">
              ×
            </button>
          </div>
          <small className="chat-subtitle">
            ตอบอัตโนมัติ • ไม่ใช่เจ้าหน้าที่หรือ AI ภายนอก
          </small>
          <div className="messages" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={"bubble " + m.role}>
                <LinkedMessage text={m.body} />
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={send}>
            <input
              aria-label="ข้อความ"
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="พิมพ์คำถามหรือวางลิงก์ PDF…"
            />
            <button disabled={busy} className="primary">
              ส่ง
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
