import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut, ClockCounterClockwise } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatDateTime, formatDaysUntil, formatMoney } from "@/lib/format";
import { cycleLabel, paymentLabel } from "@/lib/labels";
import type { Subscription, SubscriptionPayment } from "@/types";

export function SubscriptionHistoryDialog({
  subscription,
  onOpenChange,
}: {
  subscription: Subscription | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subscription) return;
    setLoading(true);
    setError(null);
    api
      .listSubscriptionPayments(subscription.id)
      .then(({ payments }) => setPayments(payments))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Falha ao carregar historico."))
      .finally(() => setLoading(false));
  }, [subscription]);

  const totals = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const payment of payments) {
      if (payment.amount == null) continue;
      byCurrency.set(payment.currency, (byCurrency.get(payment.currency) ?? 0) + payment.amount);
    }
    return [...byCurrency.entries()];
  }, [payments]);

  return (
    <Dialog open={Boolean(subscription)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Historico de pagamentos</DialogTitle>
          <DialogDescription>
            {subscription?.platform}
            {subscription?.subject ? ` - ${subscription.subject}` : ""}
          </DialogDescription>
        </DialogHeader>

        {subscription && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-muted/50 p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Plano</p>
              <p className="font-medium text-foreground">{cycleLabel[subscription.billingCycle]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Forma de pagamento</p>
              <p className="font-medium text-foreground">{paymentLabel[subscription.paymentMethod]}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Proximo vencimento</p>
              <p className="font-medium text-foreground">
                {subscription.status === "on_demand"
                  ? "Sob demanda"
                  : `${formatDate(subscription.nextRenewalDate)} - ${formatDaysUntil(subscription.daysUntil)}`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Link</p>
              {subscription.accessUrl || subscription.billingUrl ? (
                <a
                  href={subscription.accessUrl || subscription.billingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Abrir <ArrowSquareOut className="size-3" />
                </a>
              ) : (
                <p className="font-medium text-foreground">-</p>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <ClockCounterClockwise className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum pagamento registrado ainda para esta assinatura.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {payments.length} pagamento{payments.length === 1 ? "" : "s"} registrado
                {payments.length === 1 ? "" : "s"}
              </span>
              <span className="font-medium text-foreground">
                Total: {totals.map(([currency, amount]) => formatMoney(amount, currency as SubscriptionPayment["currency"])).join(" + ")}
              </span>
            </div>

            <ol className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {payments.map((payment) => (
                <li key={payment.id} className="rounded-lg px-2.5 py-2 hover:bg-muted">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{formatDateTime(payment.paidAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        Marcado por {payment.paidByName}
                        {payment.paymentMethod ? ` - ${paymentLabel[payment.paymentMethod]}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                      {formatMoney(payment.amount, payment.currency)}
                    </span>
                  </div>
                  {payment.note && (
                    <p className="mt-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {payment.note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
