import type { PersistedEdge } from '../types';
import { isValidEnsName, normaliseEns } from '../lib/ens-utils';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const LOCAL_KEY = 'japandi-ens:edges';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function useLocalFallback(): boolean {
  return !BASE_URL;
}

// ---------- localStorage fallback (works without backend) ----------
function loadLocal(): PersistedEdge[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PersistedEdge[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(edges: PersistedEdge[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(edges));
  } catch {
    // ignore quota errors
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- public API ----------
export async function getEdges(): Promise<PersistedEdge[]> {
  if (useLocalFallback()) {
    return loadLocal();
  }
  const res = await fetch(`${BASE_URL}/edges/`);
  if (!res.ok) {
    throw new ApiError(`Failed to load edges (${res.status})`, res.status);
  }
  return (await res.json()) as PersistedEdge[];
}

export async function createEdge(source: string, target: string): Promise<PersistedEdge> {
  const s = normaliseEns(source);
  const t = normaliseEns(target);
  if (!isValidEnsName(s) || !isValidEnsName(t)) {
    throw new ApiError('Both names must end in .eth', 400);
  }
  if (s === t) {
    throw new ApiError('Source and target must differ', 400);
  }

  if (useLocalFallback()) {
    const edges = loadLocal();
    const dup = edges.find(
      (e) =>
        (e.source === s && e.target === t) || (e.source === t && e.target === s),
    );
    if (dup) {
      throw new ApiError('Edge already exists', 409);
    }
    const edge: PersistedEdge = {
      id: newId(),
      source: s,
      target: t,
      created_at: new Date().toISOString(),
    };
    saveLocal([...edges, edge]);
    return edge;
  }

  const res = await fetch(`${BASE_URL}/edges/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: s, target: t }),
  });
  if (res.status === 409) throw new ApiError('Edge already exists', 409);
  if (res.status === 400) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.detail ?? 'Invalid edge', 400);
  }
  if (!res.ok) throw new ApiError(`Failed (${res.status})`, res.status);
  return (await res.json()) as PersistedEdge;
}

export async function deleteEdge(id: string | number): Promise<void> {
  if (useLocalFallback()) {
    const edges = loadLocal().filter((e) => String(e.id) !== String(id));
    saveLocal(edges);
    return;
  }
  const res = await fetch(`${BASE_URL}/edges/${id}/`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) {
    throw new ApiError(`Failed to delete (${res.status})`, res.status);
  }
}

export const apiInfo = {
  baseUrl: BASE_URL || null,
  mode: useLocalFallback() ? ('local' as const) : ('remote' as const),
};
