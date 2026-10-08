// src/lib/nav.ts

export type UserRole = "guest" | "user" | "admin";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  roles?: readonly UserRole[];
}

export const navItems: readonly NavItem[] = [
  {
    id: "home",
    label: "หน้าแรก",
    href: "/",
  },
  {
    id: "programs",
    label: "หลักสูตร",
    href: "/programs",
  },
  {
    id: "fees",
    label: "ค่าเล่าเรียน",
    href: "/fees",
  },
  {
    id: "calendar",
    label: "ปฏิทินการศึกษา",
    href: "/calendar",
  },
  {
    id: "documents",
    label: "เอกสารการสมัคร",
    href: "/documents",
  },
  {
    id: "profile",
    label: "ข้อมูลส่วนตัว",
    href: "/profile",
    roles: ["user", "admin"],
  },
  {
    id: "admin",
    label: "จัดการระบบ",
    href: "/admin",
    roles: ["admin"],
  },
  {
    id: "login",
    label: "เข้าสู่ระบบ",
    href: "/login",
    roles: ["guest"],
  },
  {
    id: "register",
    label: "สมัครสมาชิก",
    href: "/register",
    roles: ["guest"],
  },
];

/** คืนค่าเมนูที่แสดงสำหรับสิทธิ์ผู้ใช้ */
export function getNavItems(
  role: UserRole = "guest",
): NavItem[] {
  return navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}

/** ตัด query string, hash และเครื่องหมาย / ท้ายเส้นทาง */
function normalizePath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/** ตรวจสอบว่าเมนูตรงกับหน้าปัจจุบันหรือหน้าลูกหรือไม่ */
export function isActiveNav(
  pathname: string,
  href: string,
): boolean {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(href);

  if (targetPath === "/") {
    return currentPath === "/";
  }

  return (
    currentPath === targetPath ||
    currentPath.startsWith(`${targetPath}/`)
  );
}