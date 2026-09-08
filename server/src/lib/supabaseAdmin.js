import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

/**
 * Server-only client using the service_role key: bypasses RLS entirely.
 * Never expose this key or this client to the browser.
 */
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
