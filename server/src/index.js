import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { subscriptionsRouter } from "./routes/subscriptions.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

if (!config.isProduction) {
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
}

app.use("/api/auth", authRouter);
app.use("/api/subscriptions", subscriptionsRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.listen(config.port, () => {
  console.log(`API rodando em http://localhost:${config.port}`);
});
