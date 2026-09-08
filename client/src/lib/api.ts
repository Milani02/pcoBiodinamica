import type { Subscription, SubscriptionInput } from "@/types";
import { supabase } from "@/lib/supabase";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  const res = await fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listSubscriptions: () =>
    request<{ subscriptions: Subscription[] }>("/subscriptions"),
  createSubscription: (data: SubscriptionInput) =>
    request<{ subscription: Subscription }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSubscription: (id: string, data: Partial<SubscriptionInput>) =>
    request<{ subscription: Subscription }>(`/subscriptions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSubscription: (id: string) =>
    request<void>(`/subscriptions/${id}`, { method: "DELETE" }),
};

export { ApiError };
