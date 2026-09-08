import { supabaseAdmin } from "./supabaseAdmin.js";
import { usernameToEmail } from "./authEmail.js";

/**
 * Creates or updates a Supabase Auth user + its `profiles` row for the given
 * app username. Used by scripts/create-user.js and scripts/migrate-to-supabase.js.
 */
export async function upsertAppUser({ username, name, role, password }) {
  const email = usernameToEmail(username);

  const { data: existingProfile, error: lookupError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();
  if (lookupError) throw lookupError;

  let userId;
  if (existingProfile) {
    userId = existingProfile.id;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error: upsertError } = await supabaseAdmin.from("profiles").upsert({
    id: userId,
    username,
    name,
    role,
    updated_at: new Date().toISOString(),
  });
  if (upsertError) throw upsertError;

  return { id: userId, username, name, role, email };
}
