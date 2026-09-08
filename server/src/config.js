import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  isProduction: process.env.NODE_ENV === "production",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios (configure server/.env)."
  );
}
