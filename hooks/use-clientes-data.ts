"use client";

import { useEffect, useState } from "react";
import { ClientesDashboardData } from "@/lib/types";

type UseClientesDataResult = {
  data: ClientesDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useClientesData(): UseClientesDataResult {
  const [data, setData] = useState<ClientesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/clientes", {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`A API respondeu com status ${response.status}.`);
      }

      const payload = (await response.json()) as ClientesDashboardData;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
