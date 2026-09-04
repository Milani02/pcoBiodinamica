import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Eye, EyeSlash, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { AnimatedBackground } from "@/components/login/AnimatedBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import logoLight from "@/assets/brand/logo-biodinamica.png";
import logoDark from "@/assets/brand/logo-biodinamica-branca.png";

const headline = "O controle dos custos de TI da Biodinâmica.";

export function LoginPage() {
  const { status, login } = useAuth();
  const reduceMotion = useReducedMotion();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  if (status === "authenticated") return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel entrar. Tente novamente.");
      setShakeKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const words = headline.split(" ");

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      <AnimatedBackground />

      <motion.div
        className="absolute left-4 top-4 z-20 sm:left-8 sm:top-8"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <img src={logoLight} alt="Biodinamica" className="h-16 w-auto sm:h-20 lg:h-24 dark:hidden" />
        <img src={logoDark} alt="Biodinamica" className="hidden h-16 w-auto sm:h-20 lg:h-24 dark:block" />
      </motion.div>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col items-center justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:px-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left"
        >
          <h1 className="text-3xl font-semibold leading-[1.15] text-[#1c2005] sm:text-4xl lg:text-5xl dark:text-white">
            {words.map((word, i) => (
              <motion.span
                key={i}
                className="mr-[0.3em] inline-block"
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                  delay: reduceMotion ? 0 : 0.25 + i * 0.045,
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.65 }}
            className="mt-4 max-w-md text-sm text-[#3a3f1c]/80 sm:text-base dark:text-white/70"
          >
            Assinaturas, custos e vencimentos de ferramentas de TI em um so lugar.
            Acesso restrito a diretoria e ao time de TI.
          </motion.p>
        </motion.div>

        <motion.div
          key={shakeKey}
          initial={reduceMotion ? false : { opacity: 0, x: 24, filter: "blur(8px)" }}
          animate={
            shakeKey > 0 && !reduceMotion
              ? { opacity: 1, x: [0, -10, 8, -6, 0], filter: "blur(0px)" }
              : { opacity: 1, x: 0, filter: "blur(0px)" }
          }
          transition={
            shakeKey > 0
              ? { duration: 0.45, ease: "easeInOut" }
              : { duration: 0.7, delay: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }
          }
          className="relative w-full max-w-sm shrink-0 overflow-hidden rounded-2xl border border-white/25 bg-white/55 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_18px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />

          <h2 className="text-xl font-semibold text-[#161a02] dark:text-white">Entrar no painel</h2>
          <p className="mt-1 text-sm text-[#3a3f1c]/70 dark:text-white/60">
            Use as credenciais fornecidas pelo time de TI.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username" className="text-[#1c2005] dark:text-white/85">
                Usuario
              </Label>
              <Input
                id="username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-black/15 bg-white/70 dark:border-white/15 dark:bg-black/20 dark:text-white"
                placeholder="seu.usuario"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-[#1c2005] dark:text-white/85">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-black/15 bg-white/70 pr-10 dark:border-white/15 dark:bg-black/20 dark:text-white"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#3a3f1c]/60 hover:text-[#1c2005] dark:text-white/50 dark:hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 overflow-hidden text-sm text-destructive"
                  role="alert"
                >
                  <WarningCircle weight="fill" className="size-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-1 h-10 bg-[#4d590d] text-white hover:bg-[#4d590d]/90 dark:bg-[#a3b93a] dark:text-[#16190a] dark:hover:bg-[#a3b93a]/90"
            >
              {submitting ? (
                <>
                  <CircleNotch className="size-4 animate-spin" weight="bold" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#3a3f1c]/50 dark:text-white/40">
            Acesso restrito ao time interno da Biodinamica.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
