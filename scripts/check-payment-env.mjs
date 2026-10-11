// Checks the AlinmaPay / Supabase settings in a local env file and reports each by NAME only.
// It never prints a secret value. Usage:  npm run check:payments   (or: node scripts/check-payment-env.mjs path/to/file)
import { readFileSync, existsSync } from "node:fs";

const file = process.argv[2] ?? ".dev.vars";
if (!existsSync(file)) {
  console.error(`No ${file} found. Copy .dev.vars.example to .dev.vars and fill it in.`);
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

let problems = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => { problems++; console.log(`  FAIL  ${m}`); };
const warn = (m) => console.log(`  WARN  ${m}`);
const has = (k) => Boolean(env[k]);

console.log(`Checking ${file} (values are never printed)\n`);

console.log("Secrets (must be set, server-side only):");
for (const k of ["ALINMAPAY_TERMINAL_ID", "ALINMAPAY_TERMINAL_PASSWORD", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (has(k)) ok(`${k} is set`);
  else bad(`${k} is MISSING`);
}
if (!has("ALINMAPAY_MERCHANT_KEY")) bad("ALINMAPAY_MERCHANT_KEY is MISSING");
else if (/^[0-9a-fA-F]+$/.test(env.ALINMAPAY_MERCHANT_KEY) && [32, 48, 64].includes(env.ALINMAPAY_MERCHANT_KEY.length)) ok("ALINMAPAY_MERCHANT_KEY is set and has the expected hex format");
else bad("ALINMAPAY_MERCHANT_KEY is set but is not 32/48/64 hex characters (check for spaces or a partial copy)");

const key = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (key.startsWith("eyJ")) {
  try {
    const role = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role;
    if (role === "service_role") ok("SUPABASE_SERVICE_ROLE_KEY is a service_role key");
    else bad(`SUPABASE_SERVICE_ROLE_KEY looks like a "${role}" key, not service_role`);
  } catch { warn("SUPABASE_SERVICE_ROLE_KEY could not be decoded; verify it is the service-role key"); }
}

console.log("\nEnvironment selection:");
const mode = env.ALINMAPAY_ENV;
if (mode === "sandbox" || mode === "production") ok(`ALINMAPAY_ENV = ${mode}`);
else bad('ALINMAPAY_ENV must be exactly "sandbox" or "production"');
if (mode === "production") warn("PRODUCTION mode: real cards will be charged. Do not use this file for sandbox testing.");

const sig = env.ALINMAPAY_SIGNATURE_MODE || "log";
if (["log", "enforce"].includes(sig)) ok(`ALINMAPAY_SIGNATURE_MODE = ${sig}${env.ALINMAPAY_SIGNATURE_MODE ? "" : " (default)"}`);
else bad('ALINMAPAY_SIGNATURE_MODE must be "log" or "enforce"');

console.log("\nEndpoints (not secret, shown so you can verify them):");
if (!has("ALINMAPAY_PAY_REQUEST_URL")) {
  if (mode === "production") bad("ALINMAPAY_PAY_REQUEST_URL is required in production");
  else ok("ALINMAPAY_PAY_REQUEST_URL not set: the guide's sandbox URL will be used");
} else {
  try {
    const u = new URL(env.ALINMAPAY_PAY_REQUEST_URL);
    if (u.protocol === "https:" && u.hostname.endsWith("alinmapay.com.sa")) ok(`ALINMAPAY_PAY_REQUEST_URL -> ${u.hostname}${u.pathname}`);
    else bad(`ALINMAPAY_PAY_REQUEST_URL host/protocol is unexpected: ${u.protocol}//${u.hostname}`);
    if (mode === "sandbox" && !u.pathname.includes("/SB_Transactions/")) warn("sandbox mode but the URL path has no /SB_Transactions/ — confirm with AlinmaPay that this is the sandbox endpoint");
    if (mode === "production" && u.pathname.includes("/SB_Transactions/")) bad("production mode but the URL is the SANDBOX path");
  } catch { bad("ALINMAPAY_PAY_REQUEST_URL is not a valid URL"); }
}
try {
  const s = new URL(env.SITE_URL);
  ok(`SITE_URL -> ${s.origin}  (receipt URL will be ${s.origin}/api/payments/callback)`);
  if (mode === "production" && s.protocol !== "https:") bad("production SITE_URL must be https");
} catch { bad("SITE_URL is missing or not a valid URL (e.g. http://localhost:8788)"); }
try {
  const h = new URL(env.SUPABASE_URL).hostname;
  ok(`SUPABASE_URL -> ${h}`);
  warn(`Confirm ${h} is your SANDBOX/TEST Supabase project, not the one holding real customer orders.`);
} catch { bad("SUPABASE_URL is missing or not a valid URL"); }

console.log(problems ? `\n${problems} problem(s) found.` : "\nAll required settings are present and well-formed.");
process.exit(problems ? 1 : 0);
