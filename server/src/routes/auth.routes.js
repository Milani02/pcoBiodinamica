import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";

export const authRouter = Router();

// Login/logout agora sao feitos direto pelo client contra o Supabase Auth
// (ver client/src/contexts/AuthContext.tsx). Esta rota so confirma a sessao
// e devolve o perfil de app associado ao token.
authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});
