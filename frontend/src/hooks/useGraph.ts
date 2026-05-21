import { useCallback, useEffect, useState } from 'react';
import type { PersistedEdge } from '../types';
import * as api from '../services/api';

interface UseGraphResult {
  edges: PersistedEdge[];
  loading: boolean;
  error: string | null;
  addEdge: (source: string, target: string) => Promise<PersistedEdge>;
  removeEdge: (id: string | number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGraph(): UseGraphResult {
  const [edges, setEdges] = useState<PersistedEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.getEdges();
      setEdges(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load edges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addEdge = useCallback(async (source: string, target: string) => {
    const created = await api.createEdge(source, target);
    setEdges((prev) => [...prev, created]);
    return created;
  }, []);

  const removeEdge = useCallback(async (id: string | number) => {
    await api.deleteEdge(id);
    setEdges((prev) => prev.filter((e) => String(e.id) !== String(id)));
  }, []);

  return { edges, loading, error, addEdge, removeEdge, refresh };
}
