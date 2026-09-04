import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-troque-em-producao",
  cookieName: "biodinamica_session",
  isProduction: process.env.NODE_ENV === "production",
  dataDir: path.join(__dirname, "..", "data"),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
};
