
import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { KnowledgeGraphData, KnowledgeNode, KnowledgeEdge } from '../types';

interface Node extends d3.SimulationNodeDatum, KnowledgeNode {}
interface Link extends d3.SimulationLinkDatum<Node> {
    source: string | Node;
    target: string | Node;
    relationship: string;
}

export const useKnowledgeGraphD3 = (data: KnowledgeGraphData, onSelectNode: (node: KnowledgeNode | null) => void) => {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(800);
    const [height, setHeight] = useState(600);
    const simulationRef = useRef<d3.Simulation<Node, Link>>();

    const resizeObserver = useRef<ResizeObserver>();

    const updateDimensions = useCallback(() => {
        if (ref.current) {
            setWidth(ref.current.clientWidth);
            setHeight(ref.current.clientHeight);
        }
    }, []);

    useEffect(() => {
        updateDimensions();
        resizeObserver.current = new ResizeObserver(updateDimensions);
        if (ref.current) {
            resizeObserver.current.observe(ref.current);
        }
        return () => resizeObserver.current?.disconnect();
    }, [updateDimensions]);


    useEffect(() => {
        if (!ref.current || !data || data.nodes.length === 0) return;

        const svg = d3.select(ref.current).select("svg");
        svg.selectAll("*").remove();
        
        const nodes: Node[] = data.nodes.map(d => ({ ...d }));
        const links: Link[] = data.edges.map(d => ({ ...d }));

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(20));

        simulationRef.current = simulation;

        const link = svg.append("g")
            .attr("stroke-opacity", 0.4)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 1.5)
            .attr("stroke", 'var(--codex-border)');

        const node = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .call(drag(simulation) as any)
            .on("click", (event, d) => {
                onSelectNode(d);
                // Bring to front
                d3.select(event.currentTarget).raise();
            });

        const nodeColor = (group: number) => {
            const colors = [ 'var(--codex-magenta)', 'var(--codex-cyan)', 'var(--codex-gold)', 'var(--codex-blue)', '#ff5733' ];
            return colors[group % colors.length];
        }

        node.append("circle")
            .attr("r", 12)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("fill", d => nodeColor(d.group));
            
        node.append("text")
            .text(d => d.id)
            .attr("x", 15)
            .attr("y", 5)
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("paint-order", "stroke")
            .attr("stroke", "rgba(0,0,0,0.8)")
            .attr("stroke-width", 3);

        node.append("title").text(d => d.summary);

        simulation.on("tick", () => {
            link
                // Fix: Cast source and target to 'any' to allow access to x/y properties
                // populated by the d3 simulation, which TypeScript cannot infer.
                .attr("x1", d => (d.source as any).x)
                .attr("y1", d => (d.source as any).y)
                .attr("x2", d => (d.target as any).x)
                .attr("y2", d => (d.target as any).y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });
        
        const zoom = d3.zoom().on('zoom', (event) => {
            svg.selectAll('g').attr('transform', event.transform);
        });

        svg.call(zoom as any);

    }, [data, width, height, onSelectNode]);
    
    useEffect(() => {
         if (simulationRef.current) {
            simulationRef.current.force("center", d3.forceCenter(width / 2, height / 2));
            simulationRef.current.alpha(0.3).restart();
         }
    }, [width, height]);


    const drag = (simulation: d3.Simulation<Node, undefined>) => {
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    return { ref, width, height };
};

export default useKnowledgeGraphD3;
