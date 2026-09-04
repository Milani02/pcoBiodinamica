import bcrypt from "bcryptjs";
import { createJsonStore } from "../lib/jsonStore.js";

const usersStore = createJsonStore("users.json");

export async function findUserByUsername(username) {
  const users = await usersStore.read();
  return users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function hasAnyUsers() {
  const users = await usersStore.read();
  return users.length > 0;
}
