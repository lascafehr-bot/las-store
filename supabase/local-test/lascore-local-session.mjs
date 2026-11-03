// LOCAL TEST ONLY. Prints what you need to preview the LASCORE screens against the local test database, which has
// no login service: the commands to start the site, and a one-line snippet that signs your browser in as a demo user.
// Usage:  node supabase/local-test/lascore-local-session.mjs admin     (or: staff)
// The signing secret below is the throw-away one from docker-compose.yml; it only works against this local kit.
import { createHmac } from "node:crypto";

const SECRET = "local-test-only-jwt-secret-not-used-anywhere-else-1234567890";
const who = process.argv[2] === "staff" ? "staff" : "admin";
const USERS = {
  admin: { id: "aaaaaaaa-0000-0000-0000-000000000001", email: "admin@demo.local" },
  staff: { id: "bbbbbbbb-0000-0000-0000-000000000002", email: "staff@demo.local" },
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(payload) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(payload);
  return `${head}.${body}.${createHmac("sha256", SECRET).update(`${head}.${body}`).digest("base64url")}`;
}

const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
const user = USERS[who];
const anon = jwt({ role: "anon", exp });
const access = jwt({ role: "authenticated", sub: user.id, exp });
const session = {
  access_token: access,
  token_type: "bearer",
  expires_in: 7 * 24 * 3600,
  expires_at: exp,
  refresh_token: "local-test",
  user: { id: user.id, aud: "authenticated", role: "authenticated", email: user.email, app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" },
};

console.log(`LASCORE preview as ${who.toUpperCase()} (${user.email}). Valid for 7 days.

1) Start the site against the local database (PowerShell, in the project folder):

   $env:NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
   $env:NEXT_PUBLIC_SUPABASE_ANON_KEY="${anon}"
   npm run dev

2) Open http://localhost:3000/lascore , press F12, open the Console tab, paste this line and press Enter
   (Chrome may ask you to type "allow pasting" first):

   localStorage.setItem("sb-127-auth-token", ${JSON.stringify(JSON.stringify(session))}); location.href = "/lascore";

Demo data comes from seed-demo.sql. Stop the site with Ctrl+C; the settings above only last for that PowerShell window.`);
