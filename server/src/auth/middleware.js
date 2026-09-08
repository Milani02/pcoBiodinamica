import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { getProfileById, publicUser } from "./users.js";

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

export async function requireAuth(req, res, next) {
  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Nao autenticado." });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Sessao invalida ou expirada." });
  }

  const profile = await getProfileById(data.user.id);
  if (!profile) {
    return res.status(401).json({ error: "Perfil de usuario nao encontrado." });
  }

  req.user = publicUser(profile);
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Voce nao tem permissao para esta acao." });
    }
    next();
  };
}
