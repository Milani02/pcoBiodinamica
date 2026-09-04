import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { findUserByUsername, verifyPassword, publicUser } from "../auth/users.js";
import { requireAuth } from "../auth/middleware.js";
import { loginRateLimit, clearRateLimit } from "../auth/rateLimit.js";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.isProduction,
  maxAge: 8 * 60 * 60 * 1000, // 8h
};

authRouter.post("/login", loginRateLimit, async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Informe usuario e senha." });
  }

  const user = await findUserByUsername(username);
  const ok = user ? await verifyPassword(user, password) : false;

  if (!ok) {
    return res.status(401).json({ error: "Usuario ou senha invalidos." });
  }

  clearRateLimit(req);

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: "8h" }
  );

  res.cookie(config.cookieName, token, cookieOptions);
  res.json({ user: publicUser(user) });
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie(config.cookieName, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await findUserByUsername(req.user.username);
  if (!user) return res.status(401).json({ error: "Nao autenticado." });
  res.json({ user: publicUser(user) });
});
