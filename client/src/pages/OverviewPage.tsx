import { useEffect, useMemo, useState } from "react";
import { CalendarBlank, ChartBar, CurrencyCircleDollar, FileArrowDown } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { StatTile } from "@/components/StatTile";
import { Button } from "@/components/ui/button";
import { SpendBarChart, type SpendBarDatum } from "@/components/charts/SpendBarChart";
import { SpendCompositionBar } from "@/components/charts/SpendCompositionBar";
import { SpendForecastLineChart } from "@/components/charts/SpendForecastLineChart";
import { RenewalTimeline } from "@/components/RenewalTimeline";
import { Reveal } from "@/components/Reveal";
import { RenewalAlertModal } from "@/components/RenewalAlertModal";
import {
  OverviewFilters,
  defaultOverviewFilters,
  isFilterActive,
  type OverviewFilterState,
} from "@/components/OverviewFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { generateSubscriptionsReport } from "@/lib/report";
import type { PaymentMethod, Subscription } from "@/types";

function monthlyEquivalent(sub: Subscription) {
  if (sub.amount == null) return 0;
  if (sub.billingCycle === "mensal") return sub.amount;
  if (sub.billingCycle === "anual") return sub.amount / 12;
  return 0;
}

const paymentMethodLabel: Record<PaymentMethod, string> = {
  cartao_credito: "Cartao de credito",
  boleto: "Boleto",
  pix: "Pix",
  outro: "Outro",
};

function matchesFilters(sub: Subscription, filters: OverviewFilterState) {
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    if (!sub.platform.toLowerCase().includes(q) && !sub.subject.toLowerCase().includes(q)) {
      return false;
    }
  }
  if (filters.billingCycle !== "all" && sub.billingCycle !== filters.billingCycle) return false;
  if (filters.paymentMethod !== "all" && sub.paymentMethod !== filters.paymentMethod) return false;
  if (filters.status !== "all" && sub.status !== filters.status) return false;
  return true;
}

export function OverviewPage() {
  const { user } = useAuth();
  const { subscriptions, loading } = useSubscriptions();
  const [filters, setFilters] = useState<OverviewFilterState>(defaultOverviewFilters);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertSubscriptions, setAlertSubscriptions] = useState<Subscription[]>([]);

  const filtered = useMemo(
    () => subscriptions.filter((s) => matchesFilters(s, filters)),
    [subscriptions, filters]
  );
  const filterActive = isFilterActive(filters);

  const stats = useMemo(() => {
    const brl = filtered.filter((s) => s.currency === "BRL");
    const monthlyTotal = brl.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
    const annualTotal = monthlyTotal * 12;
    const upcoming = filtered.filter((s) => s.status === "warning" || s.status === "critical");
    const overdue = filtered.filter((s) => s.status === "critical");
    const foreign = filtered.filter((s) => s.currency !== "BRL");

    const byPlatform = new Map<string, number>();
    for (const s of brl) {
      byPlatform.set(s.platform, (byPlatform.get(s.platform) ?? 0) + monthlyEquivalent(s));
    }
    const barData: SpendBarDatum[] = [...byPlatform.entries()]
      .filter(([, value]) => value > 0)
      .map(([label, value]) => ({ id: label, label, value }))
      .sort((a, b) => b.value - a.value);

    const byPayment = new Map<string, number>();
    for (const s of brl) {
      byPayment.set(s.paymentMethod, (byPayment.get(s.paymentMethod) ?? 0) + monthlyEquivalent(s));
    }
    const paymentData: SpendBarDatum[] = [...byPayment.entries()]
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({ id: key, label: paymentMethodLabel[key as PaymentMethod], value }))
      .sort((a, b) => b.value - a.value);

    return { monthlyTotal, annualTotal, upcoming, overdue, foreign, barData, paymentData };
  }, [filtered]);

  useEffect(() => {
    if (loading || !user) return;
    const key = `renewal-alert:${user.username}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const sortByDays = (a: Subscription, b: Subscription) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0);
    const critical = subscriptions.filter((s) => s.status === "critical").sort(sortByDays);
    const warning = subscriptions.filter((s) => s.status === "warning").sort(sortByDays);
    if (critical.length === 0 && warning.length === 0) return;

    setAlertSubscriptions([...critical, ...warning]);
    setAlertOpen(true);
  }, [loading, subscriptions, user]);

  function handleGenerateReport() {
    generateSubscriptionsReport({
      subscriptions: filtered,
      summary: {
        monthlyTotal: stats.monthlyTotal,
        annualTotal: stats.annualTotal,
        upcomingCount: stats.upcoming.length,
        overdueCount: stats.overdue.length,
      },
      generatedBy: user,
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <RenewalAlertModal
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        subscriptions={alertSubscriptions}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Visao geral</h1>
          <p className="text-sm text-muted-foreground">
            Assinaturas e ferramentas de TI da Biodinamica.
          </p>
        </div>
        <Button variant="outline" onClick={handleGenerateReport} className="gap-1.5">
          <FileArrowDown weight="bold" className="size-4" />
          Gerar relatorio
        </Button>
      </div>

      <OverviewFilters value={filters} onChange={setFilters} />

      {filterActive && (
        <p className="-mt-3 text-xs text-muted-foreground">
          Mostrando {filtered.length} de {subscriptions.length} assinatura(s) com os filtros atuais.
        </p>
      )}

      <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Gasto mensal (BRL)"
          value={formatMoney(stats.monthlyTotal)}
          hint={
            stats.foreign.length > 0
              ? `+ ${stats.foreign.map((s) => formatMoney(s.amount, s.currency)).join(", ")} em outras moedas`
              : "Soma normalizada de planos mensais e anuais"
          }
          icon={<CurrencyCircleDollar weight="bold" className="size-4" />}
        />
        <StatTile
          label="Gasto anual (BRL)"
          value={formatMoney(stats.annualTotal)}
          hint="Projecao com base no gasto mensal atual"
          icon={<ChartBar weight="bold" className="size-4" />}
        />
        <StatTile
          label="Proximos vencimentos"
          value={String(stats.upcoming.length)}
          hint={stats.overdue.length > 0 ? `${stats.overdue.length} vencida(s)` : "Nos proximos 7 dias"}
          tone={stats.overdue.length > 0 ? "critical" : stats.upcoming.length > 0 ? "warning" : "default"}
          icon={<CalendarBlank weight="bold" className="size-4" />}
        />
      </Reveal>

      <Reveal delay={0.06} className="panel">
        <h2 className="text-sm font-semibold text-foreground">Projecao de gasto mensal</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Proximos 12 meses, somando recorrencia mensal e picos de renovacoes anuais (BRL)
        </p>
        <SpendForecastLineChart
          subscriptions={filtered}
          emptyMessage="Nenhuma assinatura com os filtros atuais."
        />
      </Reveal>

      <Reveal delay={0.1} className="panel">
        <h2 className="text-sm font-semibold text-foreground">Composicao do gasto mensal</h2>
        <p className="mb-4 text-xs text-muted-foreground">Para onde vai o orcamento de TI, por categoria</p>
        <SpendCompositionBar
          subscriptions={filtered}
          allSubscriptions={subscriptions}
          emptyMessage="Nenhuma assinatura com os filtros atuais."
        />
      </Reveal>

      <Reveal delay={0.14} className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="panel lg:col-span-3">
          <h2 className="text-sm font-semibold text-foreground">Gasto mensal por plataforma</h2>
          <p className="mb-4 text-xs text-muted-foreground">Valores em reais, normalizados por mes</p>
          <SpendBarChart data={stats.barData} emptyMessage="Nenhuma assinatura com os filtros atuais." />
        </div>

        <div className="panel lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Vencimentos</h2>
          <p className="mb-1 text-xs text-muted-foreground">Ordenado por proximidade</p>
          <RenewalTimeline subscriptions={filtered} />
        </div>
      </Reveal>

      <Reveal delay={0.18} className="panel">
        <h2 className="text-sm font-semibold text-foreground">Gasto mensal por forma de pagamento</h2>
        <p className="mb-4 text-xs text-muted-foreground">Valores em reais, normalizados por mes</p>
        <SpendBarChart data={stats.paymentData} emptyMessage="Nenhuma assinatura com os filtros atuais." />
      </Reveal>
    </div>
  );
}
