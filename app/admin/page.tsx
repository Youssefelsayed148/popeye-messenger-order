"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/orders");
        return;
      }

      if (res.status === 401) {
        setError("الباسورد غلط، حاول تاني");
      } else {
        setError("حصل خطأ، حاول تاني");
      }
    } catch {
      setError("حصل خطأ في الاتصال");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6">
      <div className="w-full rounded-2xl border border-ink/10 bg-paper p-6">
        <h1 className="mb-1 font-display text-2xl text-ink">لوحة الإدارة</h1>
        <p className="mb-6 text-sm text-muted">
          ادخل الباسورد عشان تشوف الطلبات
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="password" className="sr-only">
            الباسورد
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
            placeholder="الباسورد"
            className="h-12 rounded-full border-2 border-ink/10 bg-white px-4 font-sans text-sm text-ink placeholder:text-muted/60 transition focus:border-sauce focus:outline-none focus:ring-2 focus:ring-sauce/25"
          />

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-sauce/40 bg-sauce/10 px-3 py-2 text-center text-sm text-ink"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="mt-1 flex h-12 items-center justify-center rounded-full bg-sauce font-sans text-base font-semibold text-paper transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "بنتحقق…" : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}
