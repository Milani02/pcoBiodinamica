import type { BillingCycle, PaymentMethod } from "@/types";

export const cycleLabel: Record<BillingCycle, string> = {
  mensal: "Mensal",
  anual: "Anual",
  sob_demanda: "Sob demanda",
};

export const paymentLabel: Record<PaymentMethod, string> = {
  cartao_credito: "Cartao de credito",
  boleto: "Boleto",
  pix: "Pix",
  outro: "Outro",
};
