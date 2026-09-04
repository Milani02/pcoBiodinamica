import { useState } from "react";
import { ArrowSquareOut, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const statusBadgeClass: Record<Subscription["status"], string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  ok: "bg-success/10 text-success border-success/20",
  on_demand: "bg-muted text-muted-foreground border-transparent",
};

export function SubscriptionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin_ti";
  const { subscriptions, loading, create, update, remove } = useSubscriptions();

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
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
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
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{sub.platform}</p>
                    <p className="text-xs text-muted-foreground">{sub.subject}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{cycleLabel[sub.billingCycle]}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(sub.amount, sub.currency)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-normal", statusBadgeClass[sub.status])}>
                      {sub.status === "on_demand"
                        ? "Sob demanda"
                        : `${formatDate(sub.nextRenewalDate)} - ${formatDaysUntil(sub.daysUntil)}`}
                    </Badge>
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
              ))}
            </TableBody>
          </Table>
        </div>
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
