import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase, usernameToEmail } from "@/lib/supabase";
import { ApiError } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "Usuario ou senha invalidos.";
  }
  return message;
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }
      fetchProfile(session.user.id).then((profile) => {
        setUser(profile);
        setStatus(profile ? "authenticated" : "unauthenticated");
      });
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const email = usernameToEmail(username);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new ApiError(translateAuthError(error.message), error.status ?? 401);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort: a UI ja reage ao evento SIGNED_OUT quando ele ocorre
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
