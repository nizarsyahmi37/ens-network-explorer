import type { GraphData, GraphEdge, GraphNode } from '../types';
import { isValidEnsName, normaliseEns } from '../lib/ens-utils';

export interface ParseResult {
  data: GraphData;
  skipped: number;
}

export function parsePairInput(text: string): ParseResult {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  let skipped = 0;
  const seenEdgeKeys = new Set<string>();

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(/[,\s]+/).map((p) => normaliseEns(p)).filter(Boolean);
    if (parts.length !== 2) {
      skipped++;
      continue;
    }
    const [a, b] = parts;
    if (!isValidEnsName(a) || !isValidEnsName(b) || a === b) {
      skipped++;
      continue;
    }
    if (!nodeMap.has(a)) nodeMap.set(a, { id: a, label: a });
    if (!nodeMap.has(b)) nodeMap.set(b, { id: b, label: b });

    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seenEdgeKeys.has(key)) continue;
    seenEdgeKeys.add(key);
    edges.push({ id: `local:${key}`, source: a, target: b });
  }

  return {
    data: { nodes: Array.from(nodeMap.values()), edges },
    skipped,
  };
}

export function mergeGraphData(...sets: GraphData[]): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();

  for (const set of sets) {
    for (const n of set.nodes) {
      if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
    }
    for (const e of set.edges) {
      const key = `${e.source}|${e.target}`;
      const reverse = `${e.target}|${e.source}`;
      if (seen.has(key) || seen.has(reverse)) continue;
      seen.add(key);
      if (!nodeMap.has(e.source)) nodeMap.set(e.source, { id: e.source, label: e.source });
      if (!nodeMap.has(e.target)) nodeMap.set(e.target, { id: e.target, label: e.target });
      edges.push(e);
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges };
}
