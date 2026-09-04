import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const usersFile = path.join(dataDir, "users.json");

const VALID_ROLES = ["diretoria", "admin_ti"];

function parseArgs(argv) {
  const args = { flags: {} };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args.flags[key] = next;
        i++;
      } else {
        args.flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  args.positional = positional;
  return args;
}

function randomPassword(length = 16) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from(crypto.randomFillSync(new Uint32Array(length)))
    .map((n) => alphabet[n % alphabet.length])
    .join("");
}

function loadUsers() {
  if (!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
}

function saveUsers(users) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const username = positional[0] || flags.username;
  const role = positional[1] || flags.role;
  const name = flags.name || username;

  if (!username || !role) {
    console.log(`Uso: npm run create-user -- <usuario> <papel> [--name "Nome"] [--password "senha"]

Papeis validos: ${VALID_ROLES.join(", ")}

Exemplos:
  npm run create-user -- dono.empresa diretoria --name "Diretoria"
  npm run create-user -- admin.ti admin_ti --name "Admin TI"

Se --password nao for informado, uma senha forte e gerada e exibida uma unica vez.`);
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`Papel invalido "${role}". Use: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const password =
    typeof flags.password === "string" ? flags.password : randomPassword();
  const passwordHash = await bcrypt.hash(password, 12);

  const users = loadUsers();
  const existingIndex = users.findIndex((u) => u.username === username);
  const record = {
    id: existingIndex >= 0 ? users[existingIndex].id : crypto.randomUUID(),
    username,
    name,
    role,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    users[existingIndex] = record;
  } else {
    users.push(record);
  }

  saveUsers(users);

  console.log(`\nUsuario "${username}" (${role}) salvo em ${usersFile}.`);
  if (typeof flags.password !== "string") {
    console.log(`Senha gerada (anote agora, nao sera mostrada de novo): ${password}`);
  }
}

main();
