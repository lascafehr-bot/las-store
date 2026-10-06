"use client";

import { LascoreAuthProvider } from "@/lib/lascore/auth-context";
import { LascoreShell } from "@/app/lascore/LascoreShell";

export function LascoreApp({ children }: { children: React.ReactNode }) {
  return (
    <LascoreAuthProvider>
      <LascoreShell>{children}</LascoreShell>
    </LascoreAuthProvider>
  );
}
