// Fix: Created placeholder content for hooks/useD3Graph.ts.
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArgumentNode, ArgumentEdge } from '../types';

interface Node extends d3.SimulationNodeDatum, ArgumentNode {}
interface Link extends d3.SimulationLinkDatum<Node>, ArgumentEdge {}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface UseD3GraphOptions {
    width: number;
    height: number;
    persona1Name: string;
    persona2Name: string;
}

export const useD3Graph = (data: GraphData | null, { width, height, persona1Name }: UseD3GraphOptions) => {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current || !data || data.nodes.length === 0) {
            if(ref.current) d3.select(ref.current).selectAll("*").remove();
            return;
        }

        const svg = d3.select(ref.current);
        svg.selectAll("*").remove();

        const simulation = d3.forceSimulation(data.nodes)
            .force("link", d3.forceLink<Node, Link>(data.links).id(d => d.id).distance(80))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(20));

        const link = svg.append("g")
            .selectAll("line")
            .data(data.links)
            .join("line")
            .attr("stroke-width", 1.5)
            .attr("stroke", d => d.type === 'supports' ? 'rgba(0, 255, 100, 0.6)' : 'rgba(255, 0, 100, 0.6)')
            .attr("stroke-dasharray", d => d.type === 'refutes' ? "4 2" : "none");

        const node = svg.append("g")
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("r", 8)
            .attr("stroke", "rgba(255, 255, 255, 0.5)")
            .attr("stroke-width", 1)
            .attr("fill", d => d.author === persona1Name ? 'var(--codex-persona1-pri)' : 'var(--codex-persona2-pri)')
            .call((d: any) => d.drag(simulation));

        const label = svg.append("g")
            .selectAll("text")
            .data(data.nodes)
            .join("text")
            .text(d => d.id)
            .attr("x", 8)
            .attr("y", "0.31em")
            .attr("font-size", "9px")
            .attr("fill", "rgba(255,255,255,0.7)")
            .attr("paint-order", "stroke")
            .attr("stroke", "rgba(0,0,0,0.8)")
            .attr("stroke-width", 2);

        node.append("title").text(d => `[${d.type.toUpperCase()}] by ${d.author}:\n${d.text}`);

        simulation.on("tick", () => {
            link
                // Fix: Cast source and target to 'any' to access x/y properties.
                // TypeScript is unable to correctly infer that the simulation populates these
                // properties on the link's source and target objects.
                .attr("x1", d => (d.source as any).x)
                .attr("y1", d => (d.source as any).y)
                .attr("x2", d => (d.target as any).x)
                .attr("y2", d => (d.target as any).y);

            node
                .attr("cx", d => d.x!)
                .attr("cy", d => d.y!);

            label
                .attr("x", d => d.x! + 10)
                .attr("y", d => d.y!);
        });

    }, [data, width, height, persona1Name]);

    return ref;
};

export default useD3Graph;