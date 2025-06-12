import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap
} from '@xyflow/react';
import type { Connection, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '../store/appStore';
import type { ConceptNode, ConceptEdge } from '../types';

// The new React Flow node will carry the whole ConceptNode in its data property
type ConceptFlowNode = Node<ConceptNode>;

const MainCanvas = () => {
  // 1. Updated state access
  const { graphData, setSelectedNodeId } = useAppStore();
  
  // 2. Updated data conversion
  const convertToReactFlowNodes = (nodes: ConceptNode[]): ConceptFlowNode[] => {
    return nodes.map(node => ({
      id: node.id,
      position: node.position || { x: 0, y: 0 }, // Ensure position is defined
      data: { ...node, label: node.title }, // Pass title as label for default node
      type: 'default' // Or a custom node type
    }));
  };

  const convertToReactFlowEdges = (edges: ConceptEdge[]): Edge[] => {
    return edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
    }));
  };

  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Update React Flow nodes when graphData changes
  useEffect(() => {
    setNodes(convertToReactFlowNodes(graphData.nodes));
    setEdges(convertToReactFlowEdges(graphData.edges));
  }, [graphData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // 5. Refactored click handler
  const handleNodeClick = (
    _event: React.MouseEvent,
    node: ConceptFlowNode
  ) => {
    setSelectedNodeId(node.id);
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default MainCanvas; 