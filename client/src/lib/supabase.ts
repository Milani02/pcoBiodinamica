import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY sao obrigatorios (configure client/.env)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase Auth exige e-mail; a UI continua pedindo so um username, entao
// cada username vira um e-mail sintetico deterministico (mesma regra usada
// no server, ver server/src/lib/authEmail.js).
const LOGIN_EMAIL_DOMAIN = "login.biodinamica.internal";

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}
