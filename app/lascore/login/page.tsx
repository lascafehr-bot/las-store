"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useLascoreAuth } from "@/lib/lascore/auth-context";

export default function LascoreLoginPage() {
  const router = useRouter();
  const { configured, status, signIn, error } = useLascoreAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/lascore");
    }
  }, [router, status]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.replace("/lascore");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-las-border bg-white p-8 shadow-las">
        <div className="mb-8 text-center">
          <img
            src="/brand/las-cafe-logo.png?v=8"
            alt="LAS CAFE"
            className="mx-auto mb-4 h-12 w-auto"
          />
          <h1 className="font-brand text-2xl font-semibold text-las-primary">LASCORE</h1>
          <p className="mt-1 text-sm text-las-muted">تسجيل الدخول الداخلي</p>
        </div>

        {!configured && (
          <p className="mb-4 text-sm text-las-muted">النظام غير مضبوط بعد.</p>
        )}

        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">البريد الإلكتروني</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">كلمة المرور</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
              dir="ltr"
            />
          </label>

          {(message || error) && (
            <p className="text-sm text-red-700">{message || error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !configured}
            className="w-full bg-las-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-las-primary-hover disabled:opacity-60"
          >
            {submitting ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/lascore/forgot-password" className="text-las-accent hover:text-las-accent-hover">
            نسيت كلمة المرور؟
          </Link>
        </p>
      </div>
    </div>
  );
}
