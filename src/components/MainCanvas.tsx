import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
  BackgroundVariant,
} from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '../store/graphStore';
import ConceptNodeComponent from './ConceptNode';
import {
  convertToReactFlowNodes,
  convertToReactFlowEdges,
  handleNodeChanges,
  handleEdgeChanges,
  handleConnection,
  type ConceptFlowNode,
  type ConceptFlowEdge,
} from '../utils/reactFlowIntegration';

const MainCanvas = () => {
  const { 
    graphData, 
    selectedNodeId, 
    selectedEdgeId,
    setSelectedNodeId, 
    setSelectedEdgeId,
    updateNode,
    addEdge,
    removeNode,
    removeEdge,
  } = useGraphStore();

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    concept: ConceptNodeComponent,
  }), []);

  // Convert internal graph data to React Flow format
  const reactFlowNodes = useMemo(() => 
    convertToReactFlowNodes(graphData.nodes, selectedNodeId),
    [graphData.nodes, selectedNodeId]
  );

  const reactFlowEdges = useMemo(() => 
    convertToReactFlowEdges(graphData.edges, selectedEdgeId),
    [graphData.edges, selectedEdgeId]
  );

  // Handle node changes (position updates, deletions, etc.)
  const handleNodesChange = useCallback((changes: NodeChange<ConceptFlowNode>[]) => {
    changes.forEach(change => {
      switch (change.type) {
        case 'position':
          if (change.position && change.dragging === false) {
            // Only update position when dragging is complete
            updateNode(change.id, { position: change.position });
          }
          break;
        case 'remove':
          removeNode(change.id);
          break;
        default:
          break;
      }
    });
  }, [updateNode, removeNode]);

  // Handle edge changes (deletions, selections, etc.)
  const handleEdgesChange = useCallback((changes: EdgeChange<ConceptFlowEdge>[]) => {
    changes.forEach(change => {
      switch (change.type) {
        case 'remove':
          removeEdge(change.id);
          break;
        default:
          break;
      }
    });
  }, [removeEdge]);

  // Handle new connections
  const onConnect = useCallback((connection: Connection) => {
    const newEdge = handleConnection(connection, graphData.edges);
    
    if (newEdge) {
      addEdge(newEdge);
    }
  }, [graphData.edges, addEdge]);

  // Handle node clicks for selection
  const handleNodeClick = useCallback((
    _event: React.MouseEvent,
    node: ConceptFlowNode
  ) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null); // Clear edge selection when selecting a node
  }, [setSelectedNodeId, setSelectedEdgeId]);

  // Handle edge clicks for selection
  const handleEdgeClick = useCallback((
    _event: React.MouseEvent,
    edge: ConceptFlowEdge
  ) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null); // Clear node selection when selecting an edge
  }, [setSelectedEdgeId, setSelectedNodeId]);

  // Handle canvas clicks to clear selection
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  // Handle node double-click for editing (future feature)
  const handleNodeDoubleClick = useCallback((
    _event: React.MouseEvent,
    node: ConceptFlowNode
  ) => {
    // TODO: Open node editing modal or inline editor
    console.log('Double-clicked node:', node.data.title);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{
          padding: 50,
          maxZoom: 1.5,
          minZoom: 0.1,
        }}
        minZoom={0.05}
        maxZoom={3}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{
          strokeWidth: 2,
          stroke: '#64748b',
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Ctrl']}
        selectionKeyCode={['Shift']}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#e5e7eb"
        />
        <Controls 
          position="top-left"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <MiniMap 
          position="bottom-right"
          nodeColor={(node) => {
            const conceptNode = node as ConceptFlowNode;
            const conceptType = conceptNode.data.conceptType;
            
            switch (conceptType) {
              case 'Field': return '#1976d2';
              case 'Theory': return '#7b1fa2';
              case 'Algorithm': return '#388e3c';
              case 'Tool': return '#f57c00';
              case 'Person': return '#c2185b';
              default: return '#6b7280';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default MainCanvas; 