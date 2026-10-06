"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLascoreAuth } from "@/lib/lascore/auth-context";

export default function ResetPasswordPage() {
  const { configured, updatePassword } = useLascoreAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    setOk(result.ok);
    setMessage(result.message);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-las-border bg-white p-8 shadow-las">
        <h1 className="mb-6 text-xl font-semibold text-las-primary">تعيين كلمة مرور جديدة</h1>
        {ok ? (
          <p className="text-sm text-las-muted">
            {message}{" "}
            <Link href="/lascore/login" className="text-las-accent hover:text-las-accent-hover">
              تسجيل الدخول
            </Link>
          </p>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">كلمة المرور الجديدة</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
                dir="ltr"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">تأكيد كلمة المرور</span>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                className="w-full border border-las-border px-3 py-2.5 text-sm outline-none focus:border-las-primary"
                dir="ltr"
              />
            </label>
            {message && <p className="text-sm text-red-700">{message}</p>}
            <button
              type="submit"
              disabled={submitting || !configured}
              className="w-full bg-las-primary px-4 py-3 text-sm font-semibold text-white hover:bg-las-primary-hover disabled:opacity-60"
            >
              {submitting ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
