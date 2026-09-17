export type Role = "diretoria" | "admin_ti";

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export type BillingCycle = "mensal" | "anual" | "sob_demanda";
export type PaymentMethod = "cartao_credito" | "boleto" | "pix" | "outro";
export type RecurrenceType = "monthly_day" | "fixed_date" | "on_demand";
export type Currency = "BRL" | "USD" | "EUR";
export type RenewalStatus = "ok" | "warning" | "critical" | "on_demand";

export interface Subscription {
  id: string;
  platform: string;
  subject: string;
  billingCycle: BillingCycle;
  amount: number | null;
  currency: Currency;
  paymentMethod: PaymentMethod;
  recurrenceType: RecurrenceType;
  recurrenceDay: number | null;
  recurrenceDate: string | null;
  billingUrl: string;
  accessUrl: string;
  notes: string;
  lastPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
  nextRenewalDate: string | null;
  daysUntil: number | null;
  status: RenewalStatus;
}

export type SubscriptionInput = Omit<
  Subscription,
  "id" | "createdAt" | "updatedAt" | "nextRenewalDate" | "daysUntil" | "status" | "lastPaidAt"
>;
