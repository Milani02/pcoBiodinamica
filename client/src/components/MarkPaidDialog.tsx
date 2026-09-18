import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Subscription } from "@/types";

export function MarkPaidDialog({
  subscription,
  onOpenChange,
  onConfirm,
}: {
  subscription: Subscription | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(open: boolean) {
    if (!open) setNote("");
    onOpenChange(open);
  }

  async function handleConfirm() {
    if (!subscription) return;
    setSubmitting(true);
    const ok = await onConfirm(subscription.id, note.trim());
    setSubmitting(false);
    if (ok) handleOpenChange(false);
  }

  return (
    <Dialog open={Boolean(subscription)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como pago?</DialogTitle>
          <DialogDescription>
            {subscription?.platform}
            {subscription?.subject ? ` - ${subscription.subject}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payment-note">Observacao (opcional)</Label>
          <Textarea
            id="payment-note"
            placeholder="Ex: nota fiscal 1234, autorizado por..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Marcando..." : "Marcar como pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
