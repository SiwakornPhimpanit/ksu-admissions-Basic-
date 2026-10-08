// src/page.tsx
// Home page component — uses the project's existing CSS classes (styles.css).
// Accepts an `onNavigate` callback so the parent (App in main.tsx)
// can switch tabs without a router dependency.

import { programs } from "./data";

interface HomeProps {
  /** Called with a tab name when the user clicks a navigation button. */
  onNavigate: (tab: string) => void;
  /** Called when the user wants to open the chat panel. */
  onOpenChat?: () => void;
}

export default function Home({ onNavigate, onOpenChat }: HomeProps) {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="hero">
        <div>
          <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
          <h1>
            ระบบรับสมัครนักศึกษา
            <br />
            มหาวิทยาลัย<span>กาฬสินธุ์</span>
          </h1>

          <p>
            ยินดีต้อนรับสู่ระบบรับสมัครนักศึกษา เลือกดูข้อมูลหลักสูตร
            ค่าธรรมเนียม
            <br />
            ปฏิทินการศึกษา หรือสมัครเรียนออนไลน์
          </p>

          <nav aria-label="เมนูรับสมัครนักศึกษา" className="actions">
            <button className="lime" onClick={() => onNavigate("programs")}>
              ดูข้อมูลหลักสูตร ↗
            </button>

            <button className="outline" onClick={() => onNavigate("calendar")}>
              ปฏิทินการศึกษา
            </button>
          </nav>

          <div className="hero-note">
            สำนักส่งเสริมวิชาการและงานทะเบียน
            <br />
            <small>
              ระบบต้นแบบสำหรับพัฒนา • ตรวจสอบการเปิดรับกับมหาวิทยาลัย
            </small>
          </div>
        </div>

        <div className="hero-art" aria-hidden="true">
          <span className="orbit o1" />
          <span className="orbit o2" />
          <span className="orbit o3" />
          <div className="art-center">
            KSU
            <small>
              ENGINEER
              <br />
              YOUR FUTURE
            </small>
          </div>
          <div className="float-tag">✦ ความรู้สร้างโอกาส</div>
          <div className="year-tag">
            ADMISSION GUIDE<strong>2569</strong>
          </div>
        </div>
      </section>

      {/* ── Quick Stats ── */}
      <section className="stats">
        <div>
          <strong>04</strong>
          <span>เส้นทางการศึกษา</span>
        </div>
        <div>
          <strong>2565–69</strong>
          <span>ตารางข้อมูลค่าเล่าเรียน</span>
        </div>
        <div>
          <strong>PDF</strong>
          <span>เอกสารและประกาศ</span>
        </div>
        <div>
          <strong>24/7</strong>
          <span>ผู้ช่วยตอบคำถามอัตโนมัติ</span>
        </div>
      </section>

      {/* ── Program Cards ── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">FIND YOUR PATH</span>
            <h2>เลือกเส้นทางที่ใช่สำหรับคุณ</h2>
          </div>
          <button className="text-button" onClick={() => onNavigate("programs")}>
            ดูรายละเอียดทั้งหมด ↗
          </button>
        </div>

        <div className="cards">
          {programs.map((p, i) => (
            <button
              className="program-card"
              key={p.id}
              onClick={() => onNavigate("programs")}
            >
              <span className="card-top">
                <span className="icon">{p.icon}</span>
                <span>0{i + 1} ↗</span>
              </span>
              <h3>{p.title}</h3>
              <p>{p.qualification}</p>
              <span className="pill">ระยะเวลา {p.years} ปี</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow dark">EXPLORE MORE</span>
            <h2>เมนูลัด</h2>
          </div>
        </div>

        <div className="cards">
          <button className="program-card" onClick={() => onNavigate("programs")}>
            <span className="icon">📋</span>
            <h3>ดูค่าธรรมเนียม</h3>
            <p>ค่าเทอมแยกตามสาขาและเครื่องมือประมาณงบ</p>
          </button>

          <button className="program-card" onClick={() => onNavigate("calendar")}>
            <span className="icon">📅</span>
            <h3>ปฏิทินการศึกษา</h3>
            <p>วันเปิด-ปิดภาค สอบ และ PDF ประกาศ</p>
          </button>

          <button className="program-card" onClick={() => onNavigate("apply")}>
            <span className="icon">✍️</span>
            <h3>สมัครเรียน</h3>
            <p>กรอกคำขอสมัครในระบบต้นแบบ</p>
          </button>

          <button className="program-card" onClick={() => onNavigate("documents")}>
            <span className="icon">📄</span>
            <h3>เอกสาร PDF</h3>
            <p>ประกาศและเอกสารที่ผู้ดูแลแนบไว้</p>
          </button>
        </div>
      </section>

      {/* ── Bottom Banner ── */}
      <section className="bottom-banner">
        <div>
          <h2>มีคำถามก่อนเริ่มต้น?</h2>
          <p>ให้ผู้ช่วยแนะนำข้อมูลและแหล่งประกาศทางการ</p>
        </div>
        <button className="primary" onClick={() => onOpenChat?.()}>
          พูดคุยกับผู้ช่วย →
        </button>
      </section>
    </>
  );
}