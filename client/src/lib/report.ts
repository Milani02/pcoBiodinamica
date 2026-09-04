import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatMoney } from "@/lib/format";
import type { Subscription, User } from "@/types";

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

const statusLabel: Record<Subscription["status"], string> = {
  critical: "Vencida",
  warning: "Proxima",
  ok: "Em dia",
  on_demand: "Sob demanda",
};

interface ReportSummary {
  monthlyTotal: number;
  annualTotal: number;
  upcomingCount: number;
  overdueCount: number;
}

export function generateSubscriptionsReport({
  subscriptions,
  summary,
  generatedBy,
}: {
  subscriptions: Subscription[];
  summary: ReportSummary;
  generatedBy: User | null;
}) {
  const doc = new jsPDF({ orientation: "landscape" });
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  doc.setFontSize(16);
  doc.text("Relatorio de Assinaturas de TI - Biodinamica", 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Gerado em ${generatedAt}${generatedBy ? ` por ${generatedBy.name}` : ""}`,
    14,
    22
  );

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(
    [
      `Gasto mensal (BRL): ${formatMoney(summary.monthlyTotal)}`,
      `Gasto anual (BRL): ${formatMoney(summary.annualTotal)}`,
      `Proximos vencimentos: ${summary.upcomingCount}`,
      `Vencidas: ${summary.overdueCount}`,
    ].join("   |   "),
    14,
    30
  );

  autoTable(doc, {
    startY: 36,
    head: [["Plataforma", "Responsavel", "Ciclo", "Valor", "Pagamento", "Vencimento", "Status"]],
    body: subscriptions.map((s) => [
      s.platform,
      s.subject,
      cycleLabel[s.billingCycle],
      formatMoney(s.amount, s.currency),
      paymentLabel[s.paymentMethod],
      s.status === "on_demand" ? "Sob demanda" : formatDate(s.nextRenewalDate),
      statusLabel[s.status],
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  const filename = `relatorio-ti-biodinamica-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
