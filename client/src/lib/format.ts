import type { Currency } from "@/types";

const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
  BRL: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  USD: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" }),
  EUR: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR" }),
};

export function formatMoney(amount: number | null, currency: Currency = "BRL") {
  if (amount == null) return "Variavel";
  return currencyFormatters[currency].format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(isoDate: string | null) {
  if (!isoDate) return "Sem data fixa";
  return dateFormatter.format(new Date(`${isoDate}T00:00:00`));
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(isoDateTime: string) {
  return dateTimeFormatter.format(new Date(isoDateTime));
}

export function formatDaysUntil(daysUntil: number | null) {
  if (daysUntil == null) return "";
  if (daysUntil < 0) return `Vencida ha ${Math.abs(daysUntil)} dia${Math.abs(daysUntil) === 1 ? "" : "s"}`;
  if (daysUntil === 0) return "Vence hoje";
  if (daysUntil === 1) return "Vence amanha";
  return `Vence em ${daysUntil} dias`;
}
