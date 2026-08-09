import { STORE_CONFIG } from "@/lib/config";

export function StoreTagline() {
  return (
    <div className="border-b border-las-border/60 py-3 text-center">
      <p className="text-sm tracking-wide text-las-muted">{STORE_CONFIG.tagline}</p>
    </div>
  );
}
