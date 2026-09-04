import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Subscription, SubscriptionInput } from "@/types";

const emptyForm: SubscriptionInput = {
  platform: "",
  subject: "",
  billingCycle: "mensal",
  amount: null,
  currency: "BRL",
  paymentMethod: "cartao_credito",
  recurrenceType: "monthly_day",
  recurrenceDay: 10,
  recurrenceDate: null,
  billingUrl: "",
  accessUrl: "",
  notes: "",
};

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: Subscription | null;
  onSubmit: (data: SubscriptionInput) => Promise<boolean>;
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  subscription,
  onSubmit,
}: SubscriptionFormDialogProps) {
  const [form, setForm] = useState<SubscriptionInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(subscription);

  useEffect(() => {
    if (open) {
      setForm(subscription ? { ...emptyForm, ...subscription } : emptyForm);
    }
  }, [open, subscription]);

  function set<K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const ok = await onSubmit(form);
    setSaving(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da assinatura." : "Preencha os dados da nova assinatura de TI."}
          </DialogDescription>
        </DialogHeader>

        <form id="subscription-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="platform">Plataforma</Label>
              <Input
                id="platform"
                required
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
                placeholder="Ex: Adobe"
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="Ex: Ferramentas Marketing"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Plano</Label>
              <Select value={form.billingCycle} onValueChange={(v) => set("billingCycle", v as SubscriptionInput["billingCycle"]) }>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="sob_demanda">Sob demanda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v as SubscriptionInput["paymentMethod"]) }>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cartao_credito">Cartao de credito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount ?? ""}
                onChange={(e) => set("amount", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Deixe vazio se variavel"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Moeda</Label>
              <Select value={form.currency} onValueChange={(v) => set("currency", v as SubscriptionInput["currency"]) }>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">R$ Real</SelectItem>
                  <SelectItem value="USD">US$ Dolar</SelectItem>
                  <SelectItem value="EUR">Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Vencimento</Label>
              <Select
                value={form.recurrenceType}
                onValueChange={(v) => set("recurrenceType", v as SubscriptionInput["recurrenceType"]) }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_day">Dia fixo do mes</SelectItem>
                  <SelectItem value="fixed_date">Data especifica</SelectItem>
                  <SelectItem value="on_demand">Sem data fixa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.recurrenceType === "monthly_day" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurrenceDay">Dia do mes</Label>
                <Input
                  id="recurrenceDay"
                  type="number"
                  min="1"
                  max="31"
                  value={form.recurrenceDay ?? ""}
                  onChange={(e) => set("recurrenceDay", e.target.value === "" ? null : Number(e.target.value))}
                />
              </div>
            )}

            {form.recurrenceType === "fixed_date" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurrenceDate">Data</Label>
                <Input
                  id="recurrenceDate"
                  type="date"
                  value={form.recurrenceDate ?? ""}
                  onChange={(e) => set("recurrenceDate", e.target.value || null)}
                />
              </div>
            )}

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="billingUrl">Link de pagamento / cobranca</Label>
              <Input
                id="billingUrl"
                type="text"
                value={form.billingUrl}
                onChange={(e) => set("billingUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="accessUrl">Link de acesso ao servico</Label>
              <Input
                id="accessUrl"
                type="text"
                value={form.accessUrl}
                onChange={(e) => set("accessUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="notes">Observacoes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Ex: renovacao pedida por e-mail"
                rows={2}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="subscription-form" disabled={saving}>
            {saving ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
