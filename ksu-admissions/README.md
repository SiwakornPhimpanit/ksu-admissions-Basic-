# KSU Admissions

เว็บแอปต้นแบบรับเข้านักศึกษา สำหรับสำนักส่งเสริมวิชาการและงานทะเบียน มหาวิทยาลัยกาฬสินธุ์ ใช้ React + TypeScript + HTML + CSS, Node.js/Hono และ SQLite มีคำขอสมัคร แชทตอบอัตโนมัติ และแนบลิงก์ PDF ผู้ดูแลดูคำขอ เปลี่ยนสถานะ และเพิ่มเอกสารได้

## เริ่มใช้งานบน Windows

ใช้ Node.js 22.12 ขึ้นไป (แนะนำรุ่น LTS ที่รองรับ)

```powershell
npm install
Copy-Item .env.example .env
# แก้ ADMIN_TOKEN ใน .env ให้เป็นค่าสุ่มอย่างน้อย 32 ตัวอักษร
npm run dev
```

เปิด http://localhost:5173 หน้า React ส่วน API ทำงานที่ http://127.0.0.1:3001 ใช้ SQLite ที่ `data/admissions.sqlite` สร้างตารางอัตโนมัติเมื่อเริ่มเซิร์ฟเวอร์ เปิดเมนูผู้ดูแลท้ายหน้าและใส่ ADMIN_TOKEN ค่า token เก็บเฉพาะในหน่วยความจำหน้าเว็บ ไม่ใส่ใน localStorage หรือ Git

React อัปเดตอัตโนมัติเมื่อแก้ไฟล์ ส่วน backend ให้หยุดด้วย Ctrl+C แล้วรัน `npm run dev` ใหม่หลังแก้ไฟล์ server เพื่อให้ทำงานได้สม่ำเสมอบน Windows

```powershell
npm test
npm run build
npm start
```

หลัง build เปิด http://127.0.0.1:3001 เพื่อให้ Node.js ให้บริการทั้งเว็บและ API คำสั่ง npm run dev สำหรับเครื่องพัฒนาเท่านั้น

## โครงสร้าง

```text
src/              React UI, CSS และข้อมูลอ้างอิง
server/api.ts     REST API และตรวจสอบข้อมูลด้วย Zod
server/local.ts   Node.js + SQLite สำหรับเครื่องพัฒนา
server/worker.ts  Cloudflare Workers + D1
migrations/       SQL schema ใช้ร่วมกันทั้งสองสภาพแวดล้อม
tests/            ทดสอบ API และ SQLite ในหน่วยความจำ
wrangler.jsonc    ตั้งค่า Cloudflare
```

## Cloudflare Workers + D1

Cloudflare ใช้ D1 ฐานข้อมูลที่เข้ากันได้กับ SQLite เนื่องจากไฟล์ SQLite ของ Node.js ไม่สามารถเก็บถาวรบน Workers ได้ ฐานข้อมูลท้องถิ่นและ D1 แยกกัน ไม่ย้ายข้อมูลอัตโนมัติ

```powershell
npx wrangler login
npx wrangler d1 create ksu-admissions
# นำ database_id จากผลลัพธ์มาแทน REPLACE_WITH_D1_DATABASE_ID ใน wrangler.jsonc
npx wrangler d1 migrations apply ksu-admissions --remote
npx wrangler secret put ADMIN_TOKEN
npm run deploy
```

Wrangler จะแสดง URL `https://ksu-admissions.<account>.workers.dev` หลังเผยแพร่สำเร็จ ตรวจสอบ `/api/health` และทดสอบคำขอสมัครด้วยข้อมูลสมมติก่อนเปิดใช้งานจริง

ทดสอบ Workers บนเครื่อง:

```powershell
npm run build
npm run cf:migrate
# สร้าง .dev.vars ใส่ ADMIN_TOKEN เป็นค่าสุ่ม
npm run cf:dev
```

อ้างอิง: [Cloudflare D1](https://developers.cloudflare.com/d1/get-started/), [Hono + D1](https://developers.cloudflare.com/d1/examples/d1-and-hono/)

## อัปโหลด GitHub

สร้าง repository ว่างใน GitHub แล้วแทน YOUR_ACCOUNT และ YOUR_REPOSITORY:

```powershell
git init
git add .
git commit -m "feat: add KSU admissions application"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

ห้าม commit `.env`, `.dev.vars`, token, SQLite หรือข้อมูลผู้สมัครจริง `.gitignore` เตรียมไว้แล้ว หาก repository มีอยู่แล้ว ให้ clone ก่อนคัดลอกโค้ดและทำงานบน branch `codex/ksu-admissions`

## ตัวอย่าง API

```http
POST /api/applications
Content-Type: application/json

{"name":"นักศึกษาทดสอบ","email":"student@example.com","phone":"0812345678","program":"bachelor4","year":2569,"consent":true}
```

ตอบกลับ HTTP 201: `{"id":"UUID","status":"received"}` ผิดรูปแบบตอบ HTTP 400 ไม่คืนข้อมูลผู้สมัครผ่าน API สาธารณะ

```http
POST /api/chat
Content-Type: application/json

{"session":"ส่ง UUID ที่สร้างด้วย crypto.randomUUID()","message":"ค่าเทอมประมาณเท่าไร"}
```

ตอบ `{"reply":"ข้อความตอบพร้อมแหล่งอ้างอิง"}` แชทนี้เป็นระบบจับคำสำคัญ ไม่ใช่การคุยกับเจ้าหน้าที่ และไม่ใช้ LLM มีการจำกัดจำนวนข้อความต่อ session แต่ยังต้องเพิ่ม Turnstile/การจำกัดคำขอต่อ IP ก่อนเปิดต่อสาธารณะ

API ผู้ดูแลใช้ `Authorization: Bearer ADMIN_TOKEN`:

- `GET /api/admin/applications` อ่านล่าสุดไม่เกิน 500 คำขอ
- `PATCH /api/admin/applications/:id` รับ `{"status":"reviewing"}` ค่าที่รับ: received, reviewing, accepted, rejected
- `POST /api/admin/documents` รับ `{"title":"ปฏิทิน 2569","url":"https://example.com/calendar.pdf","year":2569}`
- `GET /api/documents` รายการเอกสารสาธารณะ

แนบลิงก์ HTTPS ผ่านผู้ดูแล หรือวางลิงก์ HTTPS ในแชทเพื่อกดเปิดได้ ไม่อัปโหลดไฟล์ ไม่ดึงเนื้อหา PDF จาก backend ลิงก์ควรชี้ไฟล์ PDF หรือหน้าเอกสารที่อนุญาตให้เผยแพร่

## SQL ทำอะไร

`CREATE TABLE` สร้างตารางคำขอสมัคร เอกสาร และข้อความแชท `CREATE INDEX` ทำให้ค้นข้อความตาม session ได้เร็ว `INSERT` บันทึกข้อมูลใหม่ `SELECT` อ่านเฉพาะข้อมูลที่ endpoint ต้องใช้ และ `UPDATE` เปลี่ยนสถานะตามเลขคำขอ ทุกค่าจากผู้ใช้ใช้ parameter binding เพื่อป้องกัน SQL injection SQLite เปิด WAL เพื่อลดการรบกวนระหว่างอ่านและเขียน

## ข้อมูลมหาวิทยาลัยและข้อจำกัด

ตรวจสอบแหล่งข้อมูลวันที่ 3 ตุลาคม 2569:

- [ระบบรับสมัคร ค่าเทอมวิศวกรรม](https://student-admis.ksu.ac.th/portal/programs/branches/65) พบอัตราอ้างอิงบางสาขา 10,200 บาท/ภาคเรียน
- [หลักสูตรที่เปิดรับ](https://student-admis.ksu.ac.th/portal/programs)
- [งานทะเบียนและประมวลผล](https://re.ksu.ac.th/?page=135414)
- PDF ปฏิทินปี 2568 และ 2569 ใช้ลิงก์จากหน้างานทะเบียนโดยตรง บันทึกเป็นเอกสารเริ่มต้นใน migrations/0002_documents.sql

ยืนยันข้อมูลอัตราค่าเล่าเรียนปี 2568 จากบัญชีหลักสูตรแล้ว ส่วนปี 2565–2567 และ 2569 แสดงค่าประมาณอิงอัตราปี 2568 พร้อมป้ายรอตรวจสอบประกาศรายปี ไม่ใช่ประวัติค่าเทอมจริง ปริญญาตรีภาคปกติในคณะมีช่วงอ้างอิง 8,700–10,800 บาท/ภาคเรียน ส่วน ปวส. 4,700–5,700 บาท/ภาคเรียน ปฏิทินแนบ PDF จากงานทะเบียนทั้งสองปีและสรุปวันภาคปกติ 2569 เครื่องคำนวณสมมติ 2 ภาคเรียนต่อปีและอัตราคงที่ ไม่รวมภาคฤดูร้อน ค่าเทียบโอน ค่าครองชีพ หรือค่าธรรมเนียมอื่น เส้นทางเทียบโอน 2/3 ปีเป็นหมวดตามโจทย์ ต้องยืนยันสาขาและระยะเวลากับคณะ

ก่อนรับข้อมูลนักศึกษาจริงต้องให้มหาวิทยาลัยอนุมัติเนื้อหา จัดทำนโยบายความเป็นส่วนตัว/ระยะเวลาเก็บข้อมูล/ช่องทางลบข้อมูล เพิ่มบัญชีเจ้าหน้าที่และสิทธิ์รายบุคคล (เช่น Cloudflare Access), Turnstile, rate limiting, audit log และแผนสำรองฐานข้อมูล ระบบนี้เป็นต้นแบบใช้งานได้ ไม่ใช่ระบบรับสมัครทางการ ไม่มีการรับชำระเงินหรือยืนยันสิทธิ์

ฟอนต์ Noto Sans Thai โหลดจาก Google Fonts หากใช้ออฟไลน์จะใช้ sans-serif ของเครื่อง

พบข้อมูลเพิ่มเติม: PDF บัญชีหลักสูตรปี 2568 ระบุวิศวกรรมหลายสาขา 10,200 บาท/ภาคเรียน, เครื่องจักรกลเกษตร 8,700, นวัตกรรมการออกแบบ 10,800, ปวส. ส่วนใหญ่ 5,700 และดิจิทัลกราฟิก 4,700 เว็บแสดงข้อมูลปี 2568 แล้ว ส่วนปีอื่นรอยืนยัน พร้อมแนบ PDF ปฏิทินทั้งสองปีไว้ในฐานข้อมูลเริ่มต้น วันปฏิทิน 2569 ในหน้าเว็บสรุปเฉพาะภาคปกติ ให้ตรวจฉบับเต็มก่อนใช้งาน
