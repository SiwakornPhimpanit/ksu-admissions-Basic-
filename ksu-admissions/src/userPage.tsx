// src/pages/UserPage.tsx
"use client";

import { useEffect, useState } from "react";

interface User {
  id: string | number;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;

  const user = value as Record<string, unknown>;

  return (
    (typeof user.id === "string" || typeof user.id === "number") &&
    typeof user.name === "string" &&
    typeof user.email === "string"
  );
}

export default function UserPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setLoading(true);
      setError("");
      setUser(null);
      setRequiresLogin(false);

      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          setRequiresLogin(true);
          throw new Error("กรุณาเข้าสู่ระบบเพื่อดูข้อมูลผู้ใช้");
        }

        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
        }

        const data: unknown = await response.json();

        if (!data || typeof data !== "object") {
          throw new Error("รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
        }

        const result = data as Record<string, unknown>;

        if (!isUser(result.user)) {
          throw new Error("ข้อมูลผู้ใช้ไม่ครบถ้วน");
        }

        if (!controller.signal.aborted) {
          setUser(result.user);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "เกิดข้อผิดพลาด กรุณาลองใหม่",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => controller.abort();
  }, [retry]);

  const linkClass =
    "rounded-lg px-4 py-2 font-medium transition-colors " +
    "focus-visible:outline focus-visible:outline-2 " +
    "focus-visible:outline-offset-4 focus-visible:outline-indigo-600";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section
        aria-labelledby="user-page-title"
        aria-busy={loading}
        className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-indigo-600">
            ระบบรับสมัครนักศึกษา มหาวิทยาลัยกาฬสินธุ์
          </p>
          <h1
            id="user-page-title"
            className="text-2xl font-bold text-slate-900"
          >
            ข้อมูลผู้ใช้
          </h1>
          <p className="mt-2 text-slate-600">
            ตรวจสอบข้อมูลบัญชีของคุณ
          </p>
        </header>

        {loading && (
          <p role="status" className="py-8 text-center text-slate-600">
            กำลังโหลดข้อมูลผู้ใช้…
          </p>
        )}

        {!loading && error && (
          <div>
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-4 text-red-700"
            >
              {error}
            </p>

            <div className="mt-4">
              {requiresLogin ? (
                <a
                  href="/login"
                  className={`${linkClass} inline-block bg-indigo-600 text-white hover:bg-indigo-700`}
                >
                  เข้าสู่ระบบ
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setRetry((value) => value + 1)}
                  className={`${linkClass} bg-indigo-600 text-white hover:bg-indigo-700`}
                >
                  ลองใหม่
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && user && (
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700"
              >
                {Array.from(user.name.trim())[0] || "U"}
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-xl font-semibold text-slate-900">
                  {user.name}
                </h2>
                <p className="break-words text-sm text-slate-500">
                  {user.email}
                </p>
              </div>
            </div>

            <dl className="divide-y divide-slate-200">
              {[
                ["รหัสผู้ใช้", String(user.id)],
                ["ชื่อ–นามสกุล", user.name],
                ["อีเมล", user.email],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid gap-1 py-4 sm:grid-cols-3 sm:gap-4"
                >
                  <dt className="font-medium text-slate-600">
                    {label}
                  </dt>
                  <dd className="break-words text-slate-900 sm:col-span-2">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-6">
          <a
            href="/"
            className={`${linkClass} inline-block border border-slate-300 text-slate-700 hover:bg-slate-100`}
          >
            กลับหน้าแรก
          </a>
        </footer>
      </section>
    </main>
  );
}