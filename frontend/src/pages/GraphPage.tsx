import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ForceGraph, edgeKey } from '../components/Graph/ForceGraph';
import { EdgeEditor } from '../components/EdgeEditor/EdgeEditor';
import { useGraph } from '../hooks/useGraph';
import { mergeGraphData, parsePairInput } from '../services/parser';
import { apiInfo } from '../services/api';
import type { GraphData, GraphEdge } from '../types';

const SAMPLE = `vitalik.eth, nick.eth
nick.eth, brantly.eth
vitalik.eth, balajis.eth
balajis.eth, naval.eth
brantly.eth, makoto.eth`;

export function GraphPage() {
  const navigate = useNavigate();
  const { edges: persisted, loading, error, addEdge, removeEdge, refresh } = useGraph();
  const [text, setText] = useState('');
  const [pasted, setPasted] = useState<GraphData>({ nodes: [], edges: [] });
  const [skipped, setSkipped] = useState(0);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [busy, setBusy] = useState(false);

  const persistedGraph: GraphData = useMemo(
    () => ({
      nodes: [],
      edges: persisted.map((e) => ({
        id: `db:${e.id}`,
        source: e.source,
        target: e.target,
      })),
    }),
    [persisted],
  );

  const merged = useMemo(
    () => mergeGraphData(pasted, persistedGraph),
    [pasted, persistedGraph],
  );

  const selectedKey = selectedEdge ? edgeKey(selectedEdge) : null;

  function onLoad() {
    const result = parsePairInput(text);
    setPasted(result.data);
    setSkipped(result.skipped);
    setSelectedEdge(null);
  }

  function onSample() {
    setText(SAMPLE);
  }

  function onClear() {
    setText('');
    setPasted({ nodes: [], edges: [] });
    setSkipped(0);
    setSelectedEdge(null);
  }

  function onEdgeClick(edge: GraphEdge) {
    if (edge.id === '__clear__') {
      setSelectedEdge(null);
      return;
    }
    setSelectedEdge((prev) =>
      prev && edgeKey(prev) === edgeKey(edge) ? null : edge,
    );
  }

  async function onAdd(s: string, t: string) {
    setBusy(true);
    try {
      await addEdge(s, t);
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmDelete() {
    if (!selectedEdge) return;
    const id = String(selectedEdge.id);
    // Only persisted edges are deletable via API
    if (id.startsWith('db:')) {
      const realId = id.slice(3);
      try {
        await removeEdge(realId);
        toast.success('Edge removed');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove edge';
        toast.error(message);
        return;
      }
    } else {
      // Local-only edge — remove from textarea-pasted set
      setPasted((prev) => ({
        nodes: prev.nodes,
        edges: prev.edges.filter((e) => edgeKey(e) !== edgeKey(selectedEdge)),
      }));
    }
    setSelectedEdge(null);
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="t-display text-[36px] sm:text-[44px]">
          The <span className="t-display-em">Web</span> of Names
        </h2>
        <p className="t-body mt-3 max-w-[520px] mx-auto">
          Paste a list of <code className="font-mono text-[0.95em]">.eth</code> pairs to map your network.
          Click a node to open its profile · click an edge to remove it.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr] items-start">
        <aside className="flex flex-col gap-4">
          <section className="card">
            <div className="section-label mb-4">
              <span>Pair Input</span>
            </div>
            <textarea
              className="input-mono w-full"
              style={{ minHeight: 160, lineHeight: 1.6, resize: 'vertical' }}
              placeholder={'name1.eth, name2.eth\nname3.eth, name4.eth'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={onLoad} disabled={!text.trim()}>
                Load Graph
              </button>
              <button type="button" className="btn-ghost" onClick={onSample}>
                Sample
              </button>
              <button type="button" className="btn-ghost" onClick={onClear}>
                Clear
              </button>
            </div>
            {skipped > 0 && (
              <div className="t-caption mt-3" style={{ color: '#8B4513' }}>
                Skipped {skipped} malformed line{skipped === 1 ? '' : 's'}
              </div>
            )}
          </section>

          <EdgeEditor onAdd={onAdd} busy={busy} />

          <section className="card">
            <div className="section-label mb-3">
              <span>Storage</span>
            </div>
            <div className="t-caption" style={{ lineHeight: 1.7 }}>
              <div>
                Mode:{' '}
                <span className="t-mono text-[11px]" style={{ color: 'var(--c-ink)' }}>
                  {apiInfo.mode === 'remote' ? 'API · Django' : 'Local · browser'}
                </span>
              </div>
              {apiInfo.baseUrl && (
                <div className="break-all">
                  Endpoint:{' '}
                  <span className="t-mono text-[10px]">{apiInfo.baseUrl}</span>
                </div>
              )}
              <div className="mt-1">Persisted edges: {persisted.length}</div>
              <div>Pasted edges: {pasted.edges.length}</div>
              {error && <div style={{ color: '#8B4513', marginTop: 6 }}>{error}</div>}
            </div>
            <div className="mt-3">
              <button type="button" className="btn-ghost" onClick={() => void refresh()} disabled={loading}>
                Refresh
              </button>
            </div>
          </section>
        </aside>

        <section className="relative">
          {merged.edges.length === 0 && merged.nodes.length === 0 ? (
            <div
              className="rounded-card flex flex-col items-center justify-center text-center px-6"
              style={{
                background: 'var(--c-washi)',
                border: '0.5px dashed var(--c-border-gold)',
                height: 520,
              }}
            >
              <div className="font-mono text-[42px] font-light" style={{ color: 'var(--c-gold)', opacity: 0.5 }}>
                間
              </div>
              <h3 className="t-heading text-[22px] mt-2">Begin with an empty canvas</h3>
              <p className="t-body mt-2 max-w-[360px]" style={{ fontSize: 13 }}>
                Add your first edge above, or paste a list of pairs to render a graph.
              </p>
              <button type="button" className="btn-ghost mt-4" onClick={onSample}>
                Load Sample
              </button>
            </div>
          ) : (
            <ForceGraph
              data={merged}
              height={560}
              onNodeClick={(name) => navigate(`/profile/${name}`)}
              onEdgeClick={onEdgeClick}
              selectedEdgeKey={selectedKey}
            />
          )}

          {selectedEdge && (
            <div
              className="absolute top-4 right-4 card"
              style={{ padding: 16, minWidth: 240, boxShadow: '0 6px 20px -8px rgba(28,25,23,0.18)' }}
              role="dialog"
              aria-label="Confirm edge deletion"
            >
              <div className="t-label text-[10px] mb-2">Remove Edge?</div>
              <div className="t-mono text-[12px]" style={{ color: 'var(--c-ink)' }}>
                {selectedEdge.source}
              </div>
              <div className="t-caption text-center" style={{ margin: '4px 0' }}>↕</div>
              <div className="t-mono text-[12px]" style={{ color: 'var(--c-ink)' }}>
                {selectedEdge.target}
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn-danger" onClick={onConfirmDelete}>
                  Remove
                </button>
                <button type="button" className="btn-ghost" onClick={() => setSelectedEdge(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
