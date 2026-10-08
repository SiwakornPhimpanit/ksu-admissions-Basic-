-- 0002_seed_documents.sql
-- ต้องรันหลัง migration ที่สร้างตาราง documents

INSERT INTO documents (id, title, url, year)
VALUES
    (
        'official-fees-2568',
        'บัญชีสถานะหลักสูตรและอัตราค่าเล่าเรียน ปีการศึกษา 2568',
        'https://websiteadmin.ksu.ac.th/FILES_UPLOADS/infoksuacth/website_20260115103310_687092558.pdf',
        2568
    ),
    (
        'calendar-2569',
        'ปฏิทินการศึกษา ปีการศึกษา 2569 ปวส. / ปริญญาตรี / บัณฑิตศึกษา',
        'https://websiteadmin.ksu.ac.th/FILES_UPLOADS/reksuacth/%E0%B8%A3%E0%B8%A7%E0%B8%A1%20%E0%B8%9B%E0%B8%A7%E0%B8%AA%20%E0%B8%9B%E0%B8%95%E0%B8%A3%E0%B8%B5%20%E0%B8%9A%E0%B8%B1%E0%B8%93%E0%B8%91%E0%B8%B4%E0%B8%95.pdf',
        2569
    ),
    (
        'calendar-2568',
        'ปฏิทินการศึกษา ภาคการศึกษาที่ 2 ปีการศึกษา 2568 ฉบับปรับปรุงรองรับการเกณฑ์ทหาร',
        'https://websiteadmin.ksu.ac.th/FILES_UPLOADS/reksuacth/1.%E0%B8%9B%E0%B8%8F%E0%B8%B4%E0%B8%97%E0%B8%B4%E0%B8%99%202-68%20%E0%B8%9B%E0%B8%A3%E0%B8%B1%E0%B8%9A%20%E0%B8%A3%E0%B8%AD%E0%B8%87%E0%B8%A3%E0%B8%B1%E0%B8%9A%E0%B8%97%E0%B8%AB%E0%B8%B2%E0%B8%A32%E0%B8%A1%E0%B8%B5%E0%B8%8469%20%E0%B8%A5%E0%B8%87%E0%B8%99%E0%B8%B2%E0%B8%A1%E0%B9%81%E0%B8%A5%E0%B9%89%E0%B8%A7.pdf',
        2568
    )
ON CONFLICT (id) DO NOTHING;