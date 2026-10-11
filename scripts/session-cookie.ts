import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

const envPath = path.resolve(__dirname, "..", ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const email = process.argv[2] ?? "demo.engineer@northriverrefining.com";

(async () => {
  const sb = createClient(URL, ANON);
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password: "DemoPassword123!",
  });
  if (error || !data.session) {
    console.error("sign-in failed:", error?.message ?? "no session");
    process.exit(1);
  }
  const s = data.session;
  const v = {
    access_token: s.access_token,
    refresh_token: s.refresh_token,
    expires_at: s.expires_at,
    expires_in: 3600,
    token_type: "bearer",
    user: s.user,
  };
  const cookie = "base64-" + Buffer.from(JSON.stringify(v)).toString("base64url");
  fs.writeFileSync(path.resolve(__dirname, "..", ".tmp-auth.cookie"), cookie);
  console.log("cookie written for", email);
})();