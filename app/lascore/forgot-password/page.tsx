"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLascoreAuth } from "@/lib/lascore/auth-context";

export default function ForgotPasswordPage() {
  const { configured, requestPasswordReset } = useLascoreAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);
    setMessage(result.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-las-border bg-white p-8 shadow-las">
        <h1 className="mb-2 text-xl font-semibold text-las-primary">استعادة كلمة المرور</h1>
        <p className="mb-6 text-sm text-las-muted">أدخل بريدك المرتبط بالحساب الداخلي.</p>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">البريد الإلكتروني</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
              dir="ltr"
            />
          </label>
          {message && <p className="text-sm text-las-muted">{message}</p>}
          <button
            type="submit"
            disabled={submitting || !configured}
            className="w-full bg-las-primary px-4 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover disabled:opacity-60"
          >
            {submitting ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/lascore/login" className="text-las-accent hover:text-las-accent-hover">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
