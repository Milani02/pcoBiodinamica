import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const outFile = path.join(dataDir, "subscriptions.json");

/**
 * Normalized from "Pianel Pagamento Diretoria.xlsx" (planilha fornecida pelo usuario).
 * recurrenceType: "monthly_day" | "fixed_date" | "on_demand"
 */
const subscriptions = [
  {
    platform: "Adobe",
    subject: "Ferramentas Marketing",
    billingCycle: "mensal",
    amount: 320,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "monthly_day",
    recurrenceDay: 19,
    recurrenceDate: null,
    billingUrl: "https://account.adobe.com/?lang=pt",
    accessUrl: "https://www.adobe.com/",
    notes: "",
  },
  {
    platform: "Adobe",
    subject: "Ferramentas Marketing",
    billingCycle: "mensal",
    amount: 320,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "monthly_day",
    recurrenceDay: 18,
    recurrenceDate: null,
    billingUrl: "https://account.adobe.com/?lang=pt",
    accessUrl: "https://www.adobe.com/",
    notes: "",
  },
  {
    platform: "Supabase",
    subject: "Banco de dados, Bioteca",
    billingCycle: "mensal",
    amount: 25,
    currency: "USD",
    paymentMethod: "cartao_credito",
    recurrenceType: "monthly_day",
    recurrenceDay: 22,
    recurrenceDate: null,
    billingUrl:
      "https://supabase.com/dashboard/org/uxbecrbzbicovyxvseho/billing",
    accessUrl: "https://supabase.com/",
    notes: "",
  },
  {
    platform: "ChatGPT",
    subject: "IA",
    billingCycle: "mensal",
    amount: 99.9,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "monthly_day",
    recurrenceDay: 10,
    recurrenceDate: null,
    billingUrl: "https://chatgpt.com/#settings/Billing",
    accessUrl: "https://chatgpt.com/",
    notes: "",
  },
  {
    platform: "Gemini",
    subject: "IA",
    billingCycle: "anual",
    amount: 969.9,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "fixed_date",
    recurrenceDay: null,
    recurrenceDate: "2027-06-10",
    billingUrl:
      "https://one.google.com/settings?utm_source=gemini&utm_medium=web&utm_campaign=gemini_manage_plan",
    accessUrl: "https://gemini.google.com/",
    notes: "",
  },
  {
    platform: "Claude",
    subject: "IA",
    billingCycle: "anual",
    amount: 1100,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "fixed_date",
    recurrenceDay: null,
    recurrenceDate: "2027-06-10",
    billingUrl: "https://claude.ai/new#settings/billing",
    accessUrl: "https://claude.ai/",
    notes: "",
  },
  {
    platform: "Hostinger",
    subject: "Servidor VPS - Servidor para aplicacao na Nuvem",
    billingCycle: "anual",
    amount: 779.88,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "fixed_date",
    recurrenceDay: null,
    recurrenceDate: "2026-09-12",
    billingUrl:
      "https://hpanel.hostinger.com/vps/1005721/overview?was_new_account_created=0",
    accessUrl: "https://hpanel.hostinger.com/",
    notes: "Renovacao manual, nao e automatica.",
  },
  {
    platform: "PowerBI",
    subject: "Dashboards",
    billingCycle: "anual",
    amount: 2787.02,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "fixed_date",
    recurrenceDay: null,
    recurrenceDate: "2026-11-10",
    billingUrl: "",
    accessUrl: "",
    notes:
      "Renovacao pedida por e-mail para elisandra.cuminesi@solonetwork.com.br",
  },
  {
    platform: "OpenAI",
    subject: "API para apps",
    billingCycle: "sob_demanda",
    amount: null,
    currency: "BRL",
    paymentMethod: "cartao_credito",
    recurrenceType: "on_demand",
    recurrenceDay: null,
    recurrenceDate: null,
    billingUrl:
      "https://platform.openai.com/settings/organization/billing/overview",
    accessUrl: "https://platform.openai.com/home",
    notes: "Pagamento conforme necessidade, recarga de creditos.",
  },
  {
    platform: "Frenet",
    subject: "Plataforma de Frete da Loja da Oraltech",
    billingCycle: "mensal",
    amount: 85,
    currency: "BRL",
    paymentMethod: "boleto",
    recurrenceType: "monthly_day",
    recurrenceDay: 10,
    recurrenceDate: null,
    billingUrl: "https://painel.frenet.com.br/Billing",
    accessUrl: "https://painel.frenet.com.br/",
    notes: "",
  },
  {
    platform: "Dropdesk",
    subject: "WhatsApp",
    billingCycle: "mensal",
    amount: 149.9,
    currency: "BRL",
    paymentMethod: "boleto",
    recurrenceType: "monthly_day",
    recurrenceDay: 18,
    recurrenceDate: null,
    billingUrl: "https://atendimento.dropdesk.app.br/subscription",
    accessUrl: "https://atendimento.dropdesk.app.br/",
    notes: "Sempre verificar uma semana antes do vencimento.",
  },
  {
    platform: "Infopec",
    subject: "Fortinet Firewall",
    billingCycle: "mensal",
    amount: 600,
    currency: "BRL",
    paymentMethod: "boleto",
    recurrenceType: "monthly_day",
    recurrenceDay: 15,
    recurrenceDate: null,
    billingUrl: "",
    accessUrl: "",
    notes: "Boleto e NF chegam por e-mail em gti@biodinamica.com.br",
  },
];

const now = new Date().toISOString();
const seeded = subscriptions.map((s) => ({
  id: randomUUID(),
  ...s,
  createdAt: now,
  updatedAt: now,
}));

fs.mkdirSync(dataDir, { recursive: true });

if (fs.existsSync(outFile) && !process.argv.includes("--force")) {
  console.log(
    `${outFile} ja existe. Use "npm run seed -- --force" para sobrescrever.`
  );
  process.exit(0);
}

fs.writeFileSync(outFile, JSON.stringify(seeded, null, 2), "utf-8");
console.log(`Seed criado com ${seeded.length} assinaturas em ${outFile}`);
