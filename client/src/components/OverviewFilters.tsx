import { FunnelSimple, X } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface OverviewFilterState {
  search: string;
  billingCycle: "all" | "mensal" | "anual" | "sob_demanda";
  paymentMethod: "all" | "cartao_credito" | "boleto" | "pix" | "outro";
  status: "all" | "ok" | "warning" | "critical" | "on_demand";
}

export const defaultOverviewFilters: OverviewFilterState = {
  search: "",
  billingCycle: "all",
  paymentMethod: "all",
  status: "all",
};

interface OverviewFiltersProps {
  value: OverviewFilterState;
  onChange: (value: OverviewFilterState) => void;
}

export function isFilterActive(f: OverviewFilterState) {
  return (
    f.search.trim() !== "" ||
    f.billingCycle !== "all" ||
    f.paymentMethod !== "all" ||
    f.status !== "all"
  );
}

export function OverviewFilters({ value, onChange }: OverviewFiltersProps) {
  const active = isFilterActive(value);

  function set<K extends keyof OverviewFilterState>(key: K, v: OverviewFilterState[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground sm:pr-1">
        <FunnelSimple weight="bold" className="size-4" />
        Filtros
      </div>

      <Input
        value={value.search}
        onChange={(e) => set("search", e.target.value)}
        placeholder="Buscar por plataforma..."
        className="sm:w-48"
      />

      <Select value={value.billingCycle} onValueChange={(v) => set("billingCycle", v as OverviewFilterState["billingCycle"]) }>
        <SelectTrigger className="sm:w-40"><SelectValue placeholder="Plano" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os planos</SelectItem>
          <SelectItem value="mensal">Mensal</SelectItem>
          <SelectItem value="anual">Anual</SelectItem>
          <SelectItem value="sob_demanda">Sob demanda</SelectItem>
        </SelectContent>
      </Select>

      <Select value={value.paymentMethod} onValueChange={(v) => set("paymentMethod", v as OverviewFilterState["paymentMethod"]) }>
        <SelectTrigger className="sm:w-44"><SelectValue placeholder="Pagamento" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as formas</SelectItem>
          <SelectItem value="cartao_credito">Cartao de credito</SelectItem>
          <SelectItem value="boleto">Boleto</SelectItem>
          <SelectItem value="pix">Pix</SelectItem>
          <SelectItem value="outro">Outro</SelectItem>
        </SelectContent>
      </Select>

      <Select value={value.status} onValueChange={(v) => set("status", v as OverviewFilterState["status"]) }>
        <SelectTrigger className="sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="ok">Em dia</SelectItem>
          <SelectItem value="warning">Atencao</SelectItem>
          <SelectItem value="critical">Vencida</SelectItem>
          <SelectItem value="on_demand">Sob demanda</SelectItem>
        </SelectContent>
      </Select>

      {active && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(defaultOverviewFilters)}
          className="gap-1 text-muted-foreground sm:ml-auto"
        >
          <X weight="bold" className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
