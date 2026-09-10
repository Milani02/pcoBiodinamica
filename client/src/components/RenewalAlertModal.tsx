import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WarningCircle, Clock } from "@phosphor-icons/react";
import { XIcon } from "lucide-react";
import type { Subscription } from "@/types";
import { formatDate, formatDaysUntil, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MAX_VISIBLE = 5;

interface RenewalAlertModalProps {
  open: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
}

export function RenewalAlertModal({ open, onClose, subscriptions }: RenewalAlertModalProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const critical = subscriptions.filter((s) => s.status === "critical");
  const warning = subscriptions.filter((s) => s.status === "warning");
  const isCritical = critical.length > 0;
  const Icon = isCritical ? WarningCircle : Clock;

  const title =
    critical.length > 0 && warning.length > 0
      ? `${critical.length} vencida${critical.length === 1 ? "" : "s"} e ${warning.length} vencendo em breve`
      : critical.length > 0
        ? `${critical.length} assinatura${critical.length === 1 ? "" : "s"} vencida${critical.length === 1 ? "" : "s"}`
        : `${warning.length} assinatura${warning.length === 1 ? "" : "s"} vencendo em breve`;

  const visible = subscriptions.slice(0, MAX_VISIBLE);
  const remaining = subscriptions.length - visible.length;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.25, ease: "easeOut" }}
            onClick={onClose}
          />

          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="renewal-alert-title"
            className={cn(
              "relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl",
              "border border-white/15 bg-popover/85 shadow-[0_30px_90px_-25px_rgba(0,0,0,0.55)]",
              "backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10"
            )}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.82, y: 16, filter: "blur(14px)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.9, y: 10, filter: "blur(8px)" }
            }
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", bounce: 0, duration: 0.5 }
            }
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
              aria-hidden="true"
            />

            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 right-3 z-10"
              onClick={onClose}
              autoFocus
            >
              <XIcon />
              <span className="sr-only">Fechar</span>
            </Button>

            <div className="flex flex-col items-start gap-4 px-6 pt-7 pb-5">
              <div className="relative flex size-12 shrink-0 items-center justify-center">
                {!reduceMotion && (
                  <motion.span
                    className={cn(
                      "absolute inset-0 rounded-2xl",
                      isCritical ? "bg-destructive/25" : "bg-warning/25"
                    )}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.55, 0, 0.55] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-2xl",
                    isCritical ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"
                  )}
                >
                  <Icon weight="fill" className="size-6" />
                </span>
              </div>

              <div>
                <h2 id="renewal-alert-title" className="text-lg leading-tight font-semibold tracking-[-0.01em] text-foreground">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confira os prazos antes que os acessos sejam interrompidos.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-0.5 divide-y divide-border/60 border-t border-border/60 px-6">
              {visible.map((sub) => {
                const critical = sub.status === "critical";
                return (
                  <div key={sub.id} className="flex items-center gap-3 py-3">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        critical ? "bg-destructive" : "bg-warning"
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {sub.platform}
                        <span className="ml-1.5 font-normal text-muted-foreground">{sub.subject}</span>
                      </p>
                      <p className={cn("text-xs", critical ? "text-destructive" : "text-warning")}>
                        {formatDate(sub.nextRenewalDate)} · {formatDaysUntil(sub.daysUntil)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                      {formatMoney(sub.amount, sub.currency)}
                    </span>
                  </div>
                );
              })}
              {remaining > 0 && (
                <p className="py-3 text-xs text-muted-foreground">
                  + {remaining} outra{remaining === 1 ? "" : "s"} assinatura{remaining === 1 ? "" : "s"} na lista de vencimentos.
                </p>
              )}
            </div>

            <div className="mt-1 bg-muted/40 p-4">
              <Button className="w-full" onClick={onClose}>
                Entendi
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
