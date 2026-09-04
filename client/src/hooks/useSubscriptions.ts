import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { Subscription, SubscriptionInput } from "@/types";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { subscriptions } = await api.listSubscriptions();
      setSubscriptions(subscriptions);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const create = useCallback(async (data: SubscriptionInput) => {
    try {
      await api.createSubscription(data);
      toast.success("Assinatura adicionada.");
      await reload();
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao adicionar.");
      return false;
    }
  }, [reload]);

  const update = useCallback(async (id: string, data: Partial<SubscriptionInput>) => {
    try {
      await api.updateSubscription(id, data);
      toast.success("Assinatura atualizada.");
      await reload();
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao atualizar.");
      return false;
    }
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    try {
      await api.deleteSubscription(id);
      toast.success("Assinatura removida.");
      await reload();
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha ao remover.");
      return false;
    }
  }, [reload]);

  return { subscriptions, loading, error, reload, create, update, remove };
}
