import { useEffect, useState } from "react";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
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
          <ol className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{formatDateTime(payment.paidAt)}</p>
                  <p className="text-xs text-muted-foreground">Marcado por {payment.paidByName}</p>
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                  {formatMoney(payment.amount, payment.currency)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
