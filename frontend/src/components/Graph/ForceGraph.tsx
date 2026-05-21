import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphEdge, GraphNode } from '../../types';
import { initialFrom } from '../../lib/ens-utils';

interface ForceGraphProps {
  data: GraphData;
  height?: number;
  onNodeClick?: (ensName: string) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  selectedEdgeKey?: string | null;
}

interface SimNode extends d3.SimulationNodeDatum, GraphNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  edge: GraphEdge;
  source: string | SimNode;
  target: string | SimNode;
}

const NODE_PALETTE = ['#2D3561', '#4A5240', '#292524', '#8B6914', '#4A5280', '#6B7A5A'];

function colourFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return NODE_PALETTE[Math.abs(hash) % NODE_PALETTE.length];
}

function edgeKey(e: GraphEdge): string {
  const s = String((e.source as unknown as SimNode).id ?? e.source);
  const t = String((e.target as unknown as SimNode).id ?? e.target);
  return s < t ? `${s}|${t}` : `${t}|${s}`;
}

export function ForceGraph({
  data,
  height = 520,
  onNodeClick,
  onEdgeClick,
  selectedEdgeKey,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodesStateRef = useRef<Map<string, SimNode>>(new Map());

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const width = container.clientWidth;
    const h = height;

    const root = d3.select(svg);
    root.attr('viewBox', `0 0 ${width} ${h}`).attr('width', '100%').attr('height', h);
    root.selectAll('*').remove();

    // Layers
    const zoomLayer = root.append('g').attr('class', 'zoom-layer');
    const edgesLayer = zoomLayer.append('g').attr('class', 'edges');
    const nodesLayer = zoomLayer.append('g').attr('class', 'nodes');

    // Reuse positions if nodes recur across renders
    const prev = nodesStateRef.current;
    const nodes: SimNode[] = data.nodes.map((n) => {
      const existing = prev.get(n.id);
      return existing
        ? { ...n, x: existing.x, y: existing.y, vx: existing.vx, vy: existing.vy }
        : { ...n };
    });
    nodesStateRef.current = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = data.edges.map((e) => ({
      edge: e,
      source: e.source,
      target: e.target,
    }));

    const sim = d3
      .forceSimulation<SimNode, SimLink>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(110)
          .strength(0.7),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, h / 2))
      .force('collide', d3.forceCollide(36));
    simRef.current = sim;

    // Edges
    const linkSel = edgesLayer
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links, (d) => edgeKey(d.edge))
      .join('line')
      .attr('stroke', '#C9A96E')
      .attr('stroke-width', 0.7)
      .attr('opacity', 0.55)
      .attr('stroke-linecap', 'round')
      .style('cursor', onEdgeClick ? 'pointer' : 'default')
      .on('click', (event, d) => {
        event.stopPropagation();
        onEdgeClick?.(d.edge);
      })
      .on('mouseenter', function () {
        d3.select(this).attr('opacity', 0.9).attr('stroke-width', 1.2);
      })
      .on('mouseleave', function (_event, d) {
        const selected = selectedEdgeKey === edgeKey(d.edge);
        d3.select(this)
          .attr('opacity', selected ? 1 : 0.55)
          .attr('stroke-width', selected ? 1.4 : 0.7);
      });

    // Highlight selected edge
    linkSel.each(function (d) {
      const selected = selectedEdgeKey === edgeKey(d.edge);
      d3.select(this)
        .attr('opacity', selected ? 1 : 0.55)
        .attr('stroke-width', selected ? 1.4 : 0.7);
    });

    // Nodes
    const nodeSel = nodesLayer
      .selectAll<SVGGElement, SimNode>('g.node')
      .data(nodes, (d) => d.id)
      .join((enter) => {
        const g = enter.append('g').attr('class', 'node').style('cursor', 'pointer');
        g.append('circle')
          .attr('r', 22)
          .attr('fill', (d) => colourFor(d.id))
          .attr('stroke', '#C9A96E')
          .attr('stroke-width', 0.8);
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 5)
          .attr('font-family', 'DM Mono, monospace')
          .attr('font-size', 13)
          .attr('font-weight', 300)
          .attr('fill', '#E8D5B0')
          .attr('pointer-events', 'none')
          .text((d) => initialFrom(d.id));
        g.append('text')
          .attr('class', 'label')
          .attr('text-anchor', 'middle')
          .attr('dy', 40)
          .attr('font-family', 'DM Sans, sans-serif')
          .attr('font-size', 11)
          .attr('font-weight', 400)
          .attr('letter-spacing', '0.04em')
          .attr('fill', '#78716C')
          .attr('pointer-events', 'none')
          .text((d) => d.label);
        return g;
      });

    nodeSel.on('click', (event, d) => {
      event.stopPropagation();
      onNodeClick?.(d.id);
    });

    nodeSel.on('mouseenter', function () {
      d3.select(this).select('circle').transition().duration(120).attr('r', 25);
    });
    nodeSel.on('mouseleave', function () {
      d3.select(this).select('circle').transition().duration(160).attr('r', 22);
    });

    // Drag
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    nodeSel.call(drag);

    sim.on('tick', () => {
      linkSel
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);
      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Pan + Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform.toString());
      });
    root.call(zoom);

    // Click on empty space → clear selection
    root.on('click', () => onEdgeClick?.({ id: '__clear__', source: '', target: '' }));

    return () => {
      sim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, height, selectedEdgeKey]);

  return (
    <div
      ref={containerRef}
      className="rounded-card overflow-hidden"
      style={{
        background: 'var(--c-washi)',
        border: '0.5px solid var(--c-border-gold)',
        height,
      }}
    >
      <svg ref={svgRef} role="img" aria-label="ENS social graph" />
    </div>
  );
}

export { edgeKey };
