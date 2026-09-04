import { Router } from "express";
import { randomUUID } from "node:crypto";
import { createJsonStore } from "../lib/jsonStore.js";
import { computeRenewalStatus } from "../lib/renewals.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const subscriptionsRouter = Router();
const store = createJsonStore("subscriptions.json");

const BILLING_CYCLES = ["mensal", "anual", "sob_demanda"];
const PAYMENT_METHODS = ["cartao_credito", "boleto", "pix", "outro"];
const RECURRENCE_TYPES = ["monthly_day", "fixed_date", "on_demand"];
const CURRENCIES = ["BRL", "USD", "EUR"];

function withStatus(subscription) {
  return { ...subscription, ...computeRenewalStatus(subscription) };
}

function validatePayload(body, { partial = false } = {}) {
  const errors = [];
  const out = {};

  const field = (key, required, validate) => {
    if (body[key] === undefined) {
      if (required && !partial) errors.push(`Campo obrigatorio: ${key}`);
      return;
    }
    const value = body[key];
    if (validate) {
      const err = validate(value);
      if (err) {
        errors.push(err);
        return;
      }
    }
    out[key] = value;
  };

  field("platform", true, (v) =>
    typeof v === "string" && v.trim() ? null : "platform deve ser um texto nao vazio"
  );
  field("subject", true, (v) =>
    typeof v === "string" ? null : "subject deve ser um texto"
  );
  field("billingCycle", true, (v) =>
    BILLING_CYCLES.includes(v) ? null : `billingCycle deve ser um de: ${BILLING_CYCLES.join(", ")}`
  );
  field("amount", false, (v) =>
    v === null || typeof v === "number" ? null : "amount deve ser numero ou null"
  );
  field("currency", false, (v) =>
    CURRENCIES.includes(v) ? null : `currency deve ser um de: ${CURRENCIES.join(", ")}`
  );
  field("paymentMethod", true, (v) =>
    PAYMENT_METHODS.includes(v) ? null : `paymentMethod deve ser um de: ${PAYMENT_METHODS.join(", ")}`
  );
  field("recurrenceType", true, (v) =>
    RECURRENCE_TYPES.includes(v) ? null : `recurrenceType deve ser um de: ${RECURRENCE_TYPES.join(", ")}`
  );
  field("recurrenceDay", false, (v) =>
    v === null || (Number.isInteger(v) && v >= 1 && v <= 31)
      ? null
      : "recurrenceDay deve ser um inteiro entre 1 e 31"
  );
  field("recurrenceDate", false, (v) =>
    v === null || /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? null
      : "recurrenceDate deve estar no formato YYYY-MM-DD"
  );
  field("billingUrl", false, (v) => (typeof v === "string" ? null : "billingUrl deve ser texto"));
  field("accessUrl", false, (v) => (typeof v === "string" ? null : "accessUrl deve ser texto"));
  field("notes", false, (v) => (typeof v === "string" ? null : "notes deve ser texto"));

  return { errors, data: out };
}

subscriptionsRouter.use(requireAuth);

subscriptionsRouter.get("/", async (_req, res) => {
  const subscriptions = await store.read();
  res.json({
    subscriptions: subscriptions
      .map(withStatus)
      .sort((a, b) => a.platform.localeCompare(b.platform, "pt-BR")),
  });
});

subscriptionsRouter.post("/", requireRole("admin_ti"), async (req, res) => {
  const { errors, data } = validatePayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    currency: "BRL",
    amount: null,
    recurrenceDay: null,
    recurrenceDate: null,
    billingUrl: "",
    accessUrl: "",
    notes: "",
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const next = await store.update((current) => [...current, record]);
  res.status(201).json({ subscription: withStatus(record), count: next.length });
});

subscriptionsRouter.put("/:id", requireRole("admin_ti"), async (req, res) => {
  const { errors, data } = validatePayload(req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  let updated = null;
  await store.update((current) => {
    const idx = current.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return current;
    updated = {
      ...current[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    const next = [...current];
    next[idx] = updated;
    return next;
  });

  if (!updated) return res.status(404).json({ error: "Assinatura nao encontrada." });
  res.json({ subscription: withStatus(updated) });
});

subscriptionsRouter.delete("/:id", requireRole("admin_ti"), async (req, res) => {
  let existed = false;
  await store.update((current) => {
    existed = current.some((s) => s.id === req.params.id);
    return current.filter((s) => s.id !== req.params.id);
  });

  if (!existed) return res.status(404).json({ error: "Assinatura nao encontrada." });
  res.status(204).send();
});
