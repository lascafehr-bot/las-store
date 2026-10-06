"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { LascoreProfile, LascoreRole } from "@/lib/lascore/types";

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

type LascoreAuthValue = {
  configured: boolean;
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: LascoreProfile | null;
  role: LascoreRole | null;
  error: string;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; message: string }>;
  updatePassword: (password: string) => Promise<{ ok: boolean; message: string }>;
};

const LascoreAuthContext = createContext<LascoreAuthValue | null>(null);

async function loadProfile(userId: string): Promise<LascoreProfile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as LascoreProfile;
}

export function LascoreAuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [status, setStatus] = useState<AuthStatus>(configured ? "loading" : "unauthenticated");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<LascoreProfile | null>(null);
  const [error, setError] = useState("");

  const applyUser = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);

    if (!nextSession?.user) {
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }

    setError("");
    const nextProfile = await loadProfile(nextSession.user.id);
    if (!nextProfile || !nextProfile.is_active) {
      const supabase = getSupabaseBrowserClient();
      await supabase?.auth.signOut();
      setProfile(null);
      setSession(null);
      setStatus("unauthenticated");
      setError("الحساب غير مفعّل. تواصل مع المسؤول.");
      return;
    }

    setProfile(nextProfile);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) void applyUser(data.session);
    }).catch(() => {
      if (!cancelled) void applyUser(null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applyUser(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applyUser, configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { ok: false, message: "لم يتم ضبط الاتصال بالنظام بعد." };
    }

    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signError) {
      return { ok: false, message: "تعذر تسجيل الدخول. تحقق من البيانات." };
    }

    return { ok: true, message: "" };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase?.auth.signOut();
    setProfile(null);
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { ok: false, message: "لم يتم ضبط الاتصال بالنظام بعد." };
    }

    const redirectTo = `${window.location.origin}/lascore/reset-password`;
    await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    return {
      ok: true,
      message: "إذا كان البريد مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.",
    };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { ok: false, message: "لم يتم ضبط الاتصال بالنظام بعد." };
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      return { ok: false, message: "تعذر تحديث كلمة المرور. أعد المحاولة من رابط جديد." };
    }
    return { ok: true, message: "تم تحديث كلمة المرور." };
  }, []);

  const value = useMemo<LascoreAuthValue>(
    () => ({
      configured,
      status,
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      error,
      signIn,
      signOut,
      requestPasswordReset,
      updatePassword,
    }),
    [configured, error, profile, requestPasswordReset, session, signIn, signOut, status, updatePassword],
  );

  return <LascoreAuthContext.Provider value={value}>{children}</LascoreAuthContext.Provider>;
}

export function useLascoreAuth(): LascoreAuthValue {
  const ctx = useContext(LascoreAuthContext);
  if (!ctx) {
    throw new Error("useLascoreAuth must be used within LascoreAuthProvider");
  }
  return ctx;
}
