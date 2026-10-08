# ผลการตรวจสอบ

- ติดตั้ง dependencies สำเร็จ ไม่มีช่องโหว่ในผล npm audit ตอนติดตั้ง
- ทดสอบ API กับฐานข้อมูล SQLite จริงแบบ in-memory ผ่าน 6 รายการ: ตรวจข้อมูล/ความยินยอม, บันทึกสมัครและสิทธิ์ผู้ดูแล, ลิงก์เอกสาร, บันทึกแชท, คำขอที่ไม่มีอยู่, จำกัดข้อความแชท
- production build ผ่าน TypeScript และ Vite
- Cloudflare Worker bundle ผ่าน `wrangler deploy --dry-run` ไม่มีการเผยแพร่จริง
- ทดสอบบน Node.js v22.15.1
- ยังไม่เผยแพร่ GitHub/Cloudflare เนื่องจากยังไม่ได้รับ repository และการเข้าถึงบัญชีปลายทาง
- ยืนยัน PDF ค่าเล่าเรียนปี 2568 และลิงก์ PDF ปฏิทิน 2568–2569 จากงานทะเบียน
- ค่าเทอมปี 2565–2567 และ 2569 ยังรอประกาศที่ยืนยันรายปี ไม่แสดงเป็นข้อมูลย้อนหลังที่ยืนยันแล้ว
- ตรวจในเบราว์เซอร์: หน้าหลักแสดงผล เอกสารเริ่มต้น 3 รายการอ่านจาก SQLite และแชทตอบค่าเทอมพร้อม HTTPS ลิงก์ที่เปิดได้
- ตรวจ npm run dev: เริ่ม React และ Node.js API ได้ หลังปรับให้ backend ไม่ใช้ watcher บน Windows
- ZIP ประกอบด้วย source, package-lock, .gitignore, .env.example, migrations, build และคู่มือ ไม่รวม node_modules, data, .env หรือ .dev.vars

โปรดรัน `npm test` และ `npm run build` หลังแก้ไขโค้ดหรืออัปเดต dependency
