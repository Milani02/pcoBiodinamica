// Supabase Auth exige e-mail para login. A UI continua pedindo apenas um
// username, entao cada username vira um e-mail sintetico deterministico
// dentro de um dominio que nunca recebe e-mail de verdade.
export const LOGIN_EMAIL_DOMAIN = "login.biodinamica.internal";

export function usernameToEmail(username) {
  return `${String(username).trim().toLowerCase()}@${LOGIN_EMAIL_DOMAIN}`;
}
