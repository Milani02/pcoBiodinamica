import { Router } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { computeRenewalStatus, advanceFixedDate } from "../lib/renewals.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

export const subscriptionsRouter = Router();
const TABLE = "subscriptions";
const PAYMENTS_TABLE = "subscription_payments";

const BILLING_CYCLES = ["mensal", "anual", "sob_demanda"];
const PAYMENT_METHODS = ["cartao_credito", "boleto", "pix", "outro"];
const RECURRENCE_TYPES = ["monthly_day", "fixed_date", "on_demand"];
const CURRENCIES = ["BRL", "USD", "EUR"];

const CAMEL_TO_SNAKE = {
  billingCycle: "billing_cycle",
  paymentMethod: "payment_method",
  recurrenceType: "recurrence_type",
  recurrenceDay: "recurrence_day",
  recurrenceDate: "recurrence_date",
  billingUrl: "billing_url",
  accessUrl: "access_url",
  lastPaidAt: "last_paid_at",
};

function toRow(data) {
  const row = {};
  for (const [key, value] of Object.entries(data)) {
    row[CAMEL_TO_SNAKE[key] || key] = value;
  }
  return row;
}

function fromRow(row) {
  return {
    id: row.id,
    platform: row.platform,
    subject: row.subject,
    billingCycle: row.billing_cycle,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.payment_method,
    recurrenceType: row.recurrence_type,
    recurrenceDay: row.recurrence_day,
    recurrenceDate: row.recurrence_date,
    billingUrl: row.billing_url,
    accessUrl: row.access_url,
    notes: row.notes,
    lastPaidAt: row.last_paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function withStatus(subscription) {
  return { ...subscription, ...computeRenewalStatus(subscription) };
}

function paymentFromRow(row) {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    paidAt: row.paid_at,
    paidByName: row.paid_by_name,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.payment_method,
    note: row.note,
  };
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
  const { data, error } = await supabaseAdmin.from(TABLE).select("*");
  if (error) throw error;

  const subscriptions = data
    .map(fromRow)
    .map(withStatus)
    .sort((a, b) => a.platform.localeCompare(b.platform, "pt-BR"));

  res.json({ subscriptions });
});

subscriptionsRouter.post("/", requireRole("admin_ti"), async (req, res) => {
  const { errors, data } = validatePayload(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  const row = {
    currency: "BRL",
    amount: null,
    recurrence_day: null,
    recurrence_date: null,
    billing_url: "",
    access_url: "",
    notes: "",
    ...toRow(data),
  };

  const { data: inserted, error } = await supabaseAdmin
    .from(TABLE)
    .insert(row)
    .select()
    .single();
  if (error) throw error;

  const { count } = await supabaseAdmin
    .from(TABLE)
    .select("id", { count: "exact", head: true });

  res.status(201).json({ subscription: withStatus(fromRow(inserted)), count });
});

subscriptionsRouter.put("/:id", requireRole("admin_ti"), async (req, res) => {
  const { errors, data } = validatePayload(req.body || {}, { partial: true });
  if (errors.length) return res.status(400).json({ error: errors.join("; ") });

  const { data: updated, error } = await supabaseAdmin
    .from(TABLE)
    .update({ ...toRow(data), updated_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .select()
    .maybeSingle();
  if (error) throw error;

  if (!updated) return res.status(404).json({ error: "Assinatura nao encontrada." });
  res.json({ subscription: withStatus(fromRow(updated)) });
});

subscriptionsRouter.get("/:id/payments", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from(PAYMENTS_TABLE)
    .select("*")
    .eq("subscription_id", req.params.id)
    .order("paid_at", { ascending: false });
  if (error) throw error;

  res.json({ payments: data.map(paymentFromRow) });
});

subscriptionsRouter.post("/:id/pay", async (req, res) => {
  const { data: current, error: fetchError } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .eq("id", req.params.id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!current) return res.status(404).json({ error: "Assinatura nao encontrada." });

  const now = new Date().toISOString();
  const updates = {
    last_paid_at: now,
    updated_at: now,
  };

  if (current.recurrence_type === "fixed_date" && current.recurrence_date) {
    updates.recurrence_date = advanceFixedDate(current.recurrence_date, current.billing_cycle);
  }

  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";

  const { error: paymentError } = await supabaseAdmin.from(PAYMENTS_TABLE).insert({
    subscription_id: current.id,
    paid_at: now,
    paid_by: req.user.id,
    paid_by_name: req.user.name,
    amount: current.amount,
    currency: current.currency,
    payment_method: current.payment_method,
    note,
  });
  if (paymentError) throw paymentError;

  const { data: updated, error } = await supabaseAdmin
    .from(TABLE)
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) throw error;

  res.json({ subscription: withStatus(fromRow(updated)) });
});

subscriptionsRouter.delete("/:id", requireRole("admin_ti"), async (req, res) => {
  const { data: deleted, error } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq("id", req.params.id)
    .select()
    .maybeSingle();
  if (error) throw error;

  if (!deleted) return res.status(404).json({ error: "Assinatura nao encontrada." });
  res.status(204).send();
});
