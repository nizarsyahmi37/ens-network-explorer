export interface ENSProfile {
  name: string;
  address: string | null;
  avatar?: string;
  displayName?: string;
  description?: string;
  url?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  email?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  avatar?: string;
}

export interface GraphEdge {
  id: string | number;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PersistedEdge extends GraphEdge {
  created_at?: string;
}
