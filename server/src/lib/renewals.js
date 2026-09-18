function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a, b) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(a) - startOfDay(b)) / MS_PER_DAY);
}

function lastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function occurrenceIn(year, monthIndex, day) {
  return new Date(year, monthIndex, Math.min(day, lastDayOfMonth(year, monthIndex)));
}

function nextMonthlyOccurrence(day, from, lastPaidAt) {
  const today = startOfDay(from);
  const paidAt = lastPaidAt ? startOfDay(lastPaidAt) : null;

  let candidate = occurrenceIn(today.getFullYear(), today.getMonth(), day);

  // Se o vencimento deste mes ja passou (ou e hoje) e ja foi pago (ultimo
  // pagamento em ou depois dessa data), o ciclo atual esta quitado — avanca
  // pro proximo mes. Sem isso, marcar como pago no proprio dia do vencimento
  // nao tirava a cobranca de "vencendo hoje", porque essa funcao so olhava
  // a data de hoje, nunca se ja tinha sido pago.
  while (paidAt && paidAt >= candidate) {
    candidate = occurrenceIn(candidate.getFullYear(), candidate.getMonth() + 1, day);
  }

  if (candidate >= today) return candidate;

  return occurrenceIn(candidate.getFullYear(), candidate.getMonth() + 1, day);
}

/**
 * Avanca uma data fixa (YYYY-MM-DD) um ciclo de cobranca a frente, usado
 * quando o admin marca uma assinatura de data fixa como paga.
 */
export function advanceFixedDate(dateStr, billingCycle) {
  const [year, month, day] = dateStr.split("-").map(Number);

  if (billingCycle === "anual") {
    const nextYear = year + 1;
    const clampedDay = Math.min(day, lastDayOfMonth(nextYear, month - 1));
    return `${nextYear}-${String(month).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
  }

  if (billingCycle === "mensal") {
    const nextMonthIndex = month; // month is 1-based, so this is "month" as 0-based next month
    const nextYear = year + Math.floor(nextMonthIndex / 12);
    const monthIndex = nextMonthIndex % 12;
    const clampedDay = Math.min(day, lastDayOfMonth(nextYear, monthIndex));
    return `${nextYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
  }

  return dateStr;
}

/**
 * @returns {{ nextRenewalDate: string|null, daysUntil: number|null, status: 'ok'|'warning'|'critical'|'on_demand' }}
 */
export function computeRenewalStatus(subscription, now = new Date()) {
  if (subscription.recurrenceType === "on_demand") {
    return { nextRenewalDate: null, daysUntil: null, status: "on_demand" };
  }

  let nextDate;
  if (subscription.recurrenceType === "fixed_date") {
    if (!subscription.recurrenceDate) {
      return { nextRenewalDate: null, daysUntil: null, status: "on_demand" };
    }
    nextDate = new Date(`${subscription.recurrenceDate}T00:00:00`);
  } else if (subscription.recurrenceType === "monthly_day") {
    nextDate = nextMonthlyOccurrence(subscription.recurrenceDay, now, subscription.lastPaidAt);
  } else {
    return { nextRenewalDate: null, daysUntil: null, status: "on_demand" };
  }

  const daysUntil = daysBetween(nextDate, now);
  let status = "ok";
  if (daysUntil < 0) status = "critical";
  else if (daysUntil <= 7) status = "warning";

  return {
    nextRenewalDate: nextDate.toISOString().slice(0, 10),
    daysUntil,
    status,
  };
}
