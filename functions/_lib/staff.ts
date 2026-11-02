// Who is calling? The LASCORE admin screens sign in with Supabase Auth and send the user's access token here.
// We ask Supabase who the token belongs to, then require an ACTIVE profile with role admin or user (staff).
import type { Env } from "./env";
import { HttpError } from "./store";

// Legacy service_role keys are JWTs and go in both headers; the newer sb_secret_ keys are apikey-only (as in store.ts).
const serviceHeaders = (env: Env): Record<string, string> => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  ...(env.SUPABASE_SERVICE_ROLE_KEY.startsWith("eyJ") ? { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } : {}),
});

export async function requireStaff(env: Env, request: Request): Promise<{ id: string; role: "admin" | "user" }> {
  const token = (request.headers.get("Authorization") ?? "").match(/^Bearer\s+([A-Za-z0-9._-]{20,4000})$/)?.[1];
  if (!token) throw new HttpError(401, "unauthorized");

  const who = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (who.status === 401 || who.status === 403) throw new HttpError(401, "unauthorized");
  if (!who.ok) throw new Error(`Supabase auth failed (HTTP ${who.status})`);
  const user = (await who.json()) as { id?: string };
  if (!user?.id || !/^[0-9a-f-]{36}$/i.test(user.id)) throw new HttpError(401, "unauthorized");

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role,is_active&limit=1`, {
    headers: serviceHeaders(env),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Supabase profiles failed (HTTP ${res.status})`);
  const profile = ((await res.json()) as { role?: string; is_active?: boolean }[])[0];
  if (!profile || profile.is_active !== true || (profile.role !== "admin" && profile.role !== "user")) throw new HttpError(403, "forbidden");
  return { id: user.id, role: profile.role };
}
