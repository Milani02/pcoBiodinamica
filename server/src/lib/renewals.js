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
