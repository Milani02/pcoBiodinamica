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

function nextMonthlyOccurrence(day, from) {
  const today = startOfDay(from);
  const clampedDay = (year, monthIndex) =>
    Math.min(day, lastDayOfMonth(year, monthIndex));

  const thisMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    clampedDay(today.getFullYear(), today.getMonth())
  );

  if (thisMonth >= today) return thisMonth;

  const nextMonthIndex = today.getMonth() + 1;
  const year = today.getFullYear() + Math.floor(nextMonthIndex / 12);
  const monthIndex = nextMonthIndex % 12;
  return new Date(year, monthIndex, clampedDay(year, monthIndex));
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
    nextDate = nextMonthlyOccurrence(subscription.recurrenceDay, now);
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
