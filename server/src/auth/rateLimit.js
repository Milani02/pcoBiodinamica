const attempts = new Map();

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function loginRateLimit(req, res, next) {
  const key = `${req.ip}:${String(req.body?.username || "").toLowerCase()}`;
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return next();
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.firstAttempt);
    res.setHeader("Retry-After", Math.ceil(retryAfterMs / 1000));
    return res.status(429).json({
      error: "Muitas tentativas de login. Tente novamente em alguns minutos.",
    });
  }

  entry.count += 1;
  next();
}

export function clearRateLimit(req) {
  const key = `${req.ip}:${String(req.body?.username || "").toLowerCase()}`;
  attempts.delete(key);
}
