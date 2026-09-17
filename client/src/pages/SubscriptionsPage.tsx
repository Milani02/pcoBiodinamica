import { useState } from "react";
import {
  ArrowSquareOut,
  CheckCircle,
  Clock,
  Infinity as InfinityIcon,
  PencilSimple,
  Plus,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/Reveal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SubscriptionFormDialog } from "@/components/SubscriptionFormDialog";
import { formatDate, formatDaysUntil, formatMoney } from "@/lib/format";
import type { Subscription } from "@/types";
import { cn } from "@/lib/utils";

const cycleLabel: Record<Subscription["billingCycle"], string> = {
  mensal: "Mensal",
  anual: "Anual",
  sob_demanda: "Sob demanda",
};

const paymentLabel: Record<Subscription["paymentMethod"], string> = {
  cartao_credito: "Cartao de credito",
  boleto: "Boleto",
  pix: "Pix",
  outro: "Outro",
};

const statusMeta: Record<Subscription["status"], { icon: typeof CheckCircle; text: string; chip: string }> = {
  critical: { icon: WarningCircle, text: "text-destructive", chip: "bg-destructive/10" },
  warning: { icon: Clock, text: "text-warning", chip: "bg-warning/10" },
  ok: { icon: CheckCircle, text: "text-success", chip: "bg-success/10" },
  on_demand: { icon: InfinityIcon, text: "text-muted-foreground", chip: "bg-muted" },
};

export function SubscriptionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin_ti";
  const { subscriptions, loading, create, update, remove, markPaid } = useSubscriptions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(sub: Subscription) {
    setEditing(sub);
    setFormOpen(true);
  }

  async function handleSubmit(data: Parameters<typeof create>[0]) {
    if (editing) return update(editing.id, data);
    return create(data);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assinaturas</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Gerencie as assinaturas de TI." : "Consulte as assinaturas de TI."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-1.5">
            <Plus weight="bold" className="size-4" />
            Nova assinatura
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <Reveal className="panel-flush overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Plataforma</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Links</TableHead>
                {isAdmin && <TableHead className="text-right">Acoes</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
                const meta = statusMeta[sub.status];
                const StatusIcon = meta.icon;
                return (
                <TableRow key={sub.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{sub.platform}</p>
                    <p className="text-xs text-muted-foreground">{sub.subject}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cycleLabel[sub.billingCycle]}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(sub.amount, sub.currency)}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-medium", meta.chip, meta.text)}>
                      <StatusIcon weight="fill" className="size-3.5 shrink-0" />
                      {sub.status === "on_demand"
                        ? "Sob demanda"
                        : `${formatDate(sub.nextRenewalDate)} - ${formatDaysUntil(sub.daysUntil)}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{paymentLabel[sub.paymentMethod]}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {sub.accessUrl && (
                        <Button variant="ghost" size="icon-sm" asChild>
                          <a href={sub.accessUrl} target="_blank" rel="noreferrer" title="Acessar servico">
                            <ArrowSquareOut className="size-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {sub.recurrenceType !== "on_demand" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => markPaid(sub.id)}
                            aria-label="Marcar como pago"
                            title="Marcar como pago"
                            className="text-success hover:text-success"
                          >
                            <CheckCircle className="size-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(sub)} aria-label="Editar">
                          <PencilSimple className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(sub)}
                          aria-label="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Reveal>
      )}

      {isAdmin && (
        <SubscriptionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          subscription={editing}
          onSubmit={handleSubmit}
        />
      )}

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai remover "{deleteTarget?.platform}" permanentemente. Essa acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
