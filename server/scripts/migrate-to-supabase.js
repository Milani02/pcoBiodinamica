import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { upsertAppUser } from "../src/lib/upsertAppUser.js";
import { supabaseAdmin } from "../src/lib/supabaseAdmin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..", "..");
const dataDir = path.join(__dirname, "..", "data");

/**
 * One-time migration: moves server/data/users.json + subscriptions.json
 * (the old JSON-file storage) into Supabase Auth + Postgres.
 * Safe to re-run: users are upserted by username, subscriptions by id.
 */

function parseCredenciais(text) {
  const passwords = {};
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const userMatch = lines[i].match(/usuario:\s*(.+)/i);
    if (!userMatch) continue;
    const username = userMatch[1].trim();
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === "") break;
      const passMatch = lines[j].match(/senha:\s*(.+)/i);
      if (passMatch) {
        passwords[username] = passMatch[1].trim();
        break;
      }
    }
  }
  return passwords;
}

async function migrateUsers() {
  const usersFile = path.join(dataDir, "users.json");
  const credFile = path.join(rootDir, "CREDENCIAIS.txt");

  if (!fs.existsSync(usersFile)) {
    console.log("Nenhum users.json encontrado, pulando migracao de usuarios.");
    return;
  }

  const users = JSON.parse(fs.readFileSync(usersFile, "utf-8"));
  const passwords = fs.existsSync(credFile)
    ? parseCredenciais(fs.readFileSync(credFile, "utf-8"))
    : {};

  for (const user of users) {
    const password = passwords[user.username];
    if (!password) {
      console.warn(
        `Sem senha para "${user.username}" em CREDENCIAIS.txt, pulando (rode create-user manualmente depois).`
      );
      continue;
    }
    await upsertAppUser({
      username: user.username,
      name: user.name,
      role: user.role,
      password,
    });
    console.log(`Usuario migrado: ${user.username} (${user.role})`);
  }
}

async function migrateSubscriptions() {
  const subsFile = path.join(dataDir, "subscriptions.json");
  if (!fs.existsSync(subsFile)) {
    console.log("Nenhum subscriptions.json encontrado, pulando migracao de assinaturas.");
    return;
  }

  const subscriptions = JSON.parse(fs.readFileSync(subsFile, "utf-8"));
  const rows = subscriptions.map((s) => ({
    id: s.id,
    platform: s.platform,
    subject: s.subject,
    billing_cycle: s.billingCycle,
    amount: s.amount,
    currency: s.currency,
    payment_method: s.paymentMethod,
    recurrence_type: s.recurrenceType,
    recurrence_day: s.recurrenceDay,
    recurrence_date: s.recurrenceDate,
    billing_url: s.billingUrl,
    access_url: s.accessUrl,
    notes: s.notes,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }));

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;

  console.log(`${rows.length} assinatura(s) migrada(s).`);
}

async function main() {
  await migrateUsers();
  await migrateSubscriptions();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
