import { supabaseAdmin } from "../lib/supabaseAdmin.js";

export function publicUser(profile) {
  if (!profile) return null;
  const { id, username, name, role } = profile;
  return { id, username, name, role };
}

export async function getProfileById(id) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, name, role")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, name, role")
    .ilike("username", username)
    .maybeSingle();
  if (error) throw error;
  return data;
}
