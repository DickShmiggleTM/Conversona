import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
import SpriteText from 'three-spritetext';
import { KnowledgeGraphData, KnowledgeNode } from '../types';

interface Node3D extends d3.SimulationNodeDatum, KnowledgeNode {
  x: number;
  y: number;
  z: number;
}

interface Link3D extends d3.SimulationLinkDatum<Node3D> {
  source: Node3D;
  target: Node3D;
  relationship: string;
}

const ForceGraph = ({ graphData, onSelectNode }: { graphData: KnowledgeGraphData, onSelectNode: (node: KnowledgeNode | null) => void }) => {
  const [nodes, setNodes] = useState<Node3D[]>([]);
  const [links, setLinks] = useState<Link3D[]>([]);
  const simulationRef = useRef<d3.Simulation<Node3D, Link3D>>();

  useEffect(() => {
    const simNodes: Node3D[] = graphData.nodes.map(node => ({
      ...node,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      z: Math.random() * 200 - 100,
    }));

    const simLinks: Link3D[] = graphData.edges.map(edge => ({
      ...edge,
      source: simNodes.find(n => n.id === edge.source)!,
      target: simNodes.find(n => n.id === edge.target)!,
    })).filter(l => l.source && l.target);

    setNodes(simNodes);
    setLinks(simLinks);

    simulationRef.current = d3
      .forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(0, 0, 0))
      .alpha(1.5)
      .alphaDecay(0.02);

  }, [graphData]);

  useFrame(() => {
    if (simulationRef.current) {
      simulationRef.current.tick();
      setNodes([...simulationRef.current.nodes()]);
    }
  });

  const nodeColor = (group: number) => {
    const colors = [ '#ff00ff', '#00ffcc', '#ffc800', '#4f8fef', '#ff5733', '#8a2be2', '#32cd32' ];
    return colors[group % colors.length];
  }

  return (
    <>
      {nodes.map(node => (
        <mesh key={node.id} position={[node.x, node.y, node.z]} onClick={() => onSelectNode(node)}>
          <sphereGeometry args={[2.5, 16, 16]} />
          <meshStandardMaterial color={nodeColor(node.group)} emissive={nodeColor(node.group)} emissiveIntensity={0.5} />
          <Text
             position={[0, 4, 0]}
             fontSize={2}
             color="white"
             anchorX="center"
             anchorY="middle"
          >
              {node.id}
          </Text>
        </mesh>
      ))}
      {links.map((link, i) => {
          const points = [
              new THREE.Vector3(link.source.x, link.source.y, link.source.z),
              new THREE.Vector3(link.target.x, link.target.y, link.target.z),
          ];
          const curve = new THREE.CatmullRomCurve3(points);
          return (
              <line key={i}>
                  <bufferGeometry attach="geometry" setFromPoints={curve.getPoints(50)} />
                  <lineBasicMaterial attach="material" color="#ffffff" transparent opacity={0.3} />
              </line>
          )
      })}
    </>
  );
};

const KnowledgeGraph3D: React.FC<{ graphData: KnowledgeGraphData; onSelectNode: (node: KnowledgeNode | null) => void; }> = ({ graphData, onSelectNode }) => {
  return (
    <Canvas camera={{ position: [0, 0, 200], fov: 75 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[100, 100, 100]} />
      <ForceGraph graphData={graphData} onSelectNode={onSelectNode} />
      <OrbitControls />
    </Canvas>
  );
};

export default KnowledgeGraph3D;
