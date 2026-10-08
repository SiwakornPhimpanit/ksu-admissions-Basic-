-- 0001_create_initial_tables.sql
-- สร้างตารางพื้นฐานสำหรับระบบรับสมัคร

CREATE TABLE IF NOT EXISTS applications (
    id         TEXT NOT NULL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT NOT NULL,
    program    TEXT NOT NULL,
    year       INTEGER NOT NULL,
    status     TEXT NOT NULL DEFAULT 'received',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id         TEXT NOT NULL PRIMARY KEY,
    title      TEXT NOT NULL,
    url        TEXT NOT NULL,
    year       INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id         TEXT NOT NULL PRIMARY KEY,
    session    TEXT NOT NULL,
    role       TEXT NOT NULL
               CHECK (role IN ('user', 'assistant')),
    body       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ช่วยให้ค้นหาประวัติข้อความตาม session และเวลาได้เร็วขึ้น
CREATE INDEX IF NOT EXISTS messages_session
    ON messages (session, created_at);