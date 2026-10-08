import { createHash, timingSafeEqual } from "node:crypto";

export interface AdminUser {
  name: string;
  email: string;
  role: "admin";
}

function secureEqual(value: string, expected: string): boolean {
  const a = createHash("sha256").update(value).digest();
  const b = createHash("sha256").update(expected).digest();

  return timingSafeEqual(a, b);
}

export function authenticateAdmin(
  email: unknown,
  password: unknown,
): AdminUser | null {
  if (typeof email !== "string" || typeof password !== "string") {
    return null;
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@gmail.com")
    .trim()
    .toLowerCase();

  const adminPassword = process.env.ADMIN_PASSWORD ?? "1234";

  const emailMatches = secureEqual(
    email.trim().toLowerCase(),
    adminEmail,
  );
  const passwordMatches = secureEqual(password, adminPassword);

  if (!emailMatches || !passwordMatches) {
    return null;
  }

  return {
    name: "Admin",
    email: adminEmail,
    role: "admin",
  };
}