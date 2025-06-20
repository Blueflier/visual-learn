import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionLineType,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '../store/graphStore';
import ConceptNodeComponent from './ConceptNode';
import {
  convertToReactFlowNodes,
  convertToReactFlowEdges,
  handleConnection,
  type ConceptFlowNode,
  type ConceptFlowEdge,
} from '../utils/reactFlowIntegration';
import { autoLayout, GraphLayoutUtils } from '../utils/graphLayout';

// Define node types outside component to maintain stable reference
const nodeTypes = {
  concept: ConceptNodeComponent,
};

const MainCanvas = () => {
  const { 
    graphData, 
    viewState,
    selectedNodeId, 
    selectedEdgeId,
    setSelectedNodeId, 
    setSelectedEdgeId,
    updateNode,
    addEdge,
    removeNode,
    removeEdge,
    batchUpdateNodes,
    focusOnNode,
    createContextMenu,
    closeContextMenu,
  } = useGraphStore();

  const reactFlowInstance = useReactFlow();
  const previousModeRef = useRef(viewState.mode);
  const previousRootRef = useRef(viewState.rootConceptId);

  // Convert internal graph data to React Flow format with stable references
  const initialNodes = useMemo(() => 
    convertToReactFlowNodes(graphData.nodes, selectedNodeId),
    [graphData.nodes, selectedNodeId]
  );

  const initialEdges = useMemo(() => 
    convertToReactFlowEdges(graphData.edges, selectedEdgeId),
    [graphData.edges, selectedEdgeId]
  );

  // Use React Flow's built-in state management for optimal performance
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Apply layout when mode changes
  useEffect(() => {
    const modeChanged = previousModeRef.current !== viewState.mode;
    const rootChanged = previousRootRef.current !== viewState.rootConceptId;
    
    if ((modeChanged || rootChanged) && graphData.nodes.length > 0) {
      console.log('🔄 Layout mode changed:', {
        from: previousModeRef.current,
        to: viewState.mode,
        rootConceptId: viewState.rootConceptId
      });

      // Get canvas dimensions
      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;

      // Apply the appropriate layout
      const layoutedGraph = autoLayout(
        graphData,
        viewState.mode,
        canvasWidth,
        canvasHeight,
        viewState.rootConceptId
      );

      // Animate to new positions if mode changed
      if (modeChanged) {
        GraphLayoutUtils.animateToPositions(
          graphData.nodes,
          layoutedGraph.nodes,
          800, // 800ms animation
          (animatedNodes) => {
            // Update the store with animated positions
            const updates = animatedNodes.map(node => ({
              id: node.id,
              updates: { position: node.position }
            }));
            batchUpdateNodes(updates);
          }
        );
      } else {
        // Just update positions immediately for root changes
        const updates = layoutedGraph.nodes.map(node => ({
          id: node.id,
          updates: { position: node.position }
        }));
        batchUpdateNodes(updates);
      }

      // Update refs
      previousModeRef.current = viewState.mode;
      previousRootRef.current = viewState.rootConceptId;
    }
  }, [viewState.mode, viewState.rootConceptId, graphData, reactFlowInstance, batchUpdateNodes]);

  // Sync React Flow state with store state when store changes
  useEffect(() => {
    const newNodes = convertToReactFlowNodes(graphData.nodes, selectedNodeId);
    setNodes(newNodes);
  }, [graphData.nodes, selectedNodeId, setNodes]);

  useEffect(() => {
    const newEdges = convertToReactFlowEdges(graphData.edges, selectedEdgeId);
    setEdges(newEdges);
  }, [graphData.edges, selectedEdgeId, setEdges]);

  // Enhanced node change handler with batched updates
  const handleNodesChange = useCallback((changes: NodeChange<ConceptFlowNode>[]) => {
    // Apply changes to React Flow state immediately for smooth interaction
    onNodesChange(changes);
    
    // Batch store updates to avoid multiple re-renders
    const storeUpdates: Array<() => void> = [];
    
    changes.forEach(change => {
      switch (change.type) {
        case 'position':
          if (change.position && change.dragging === false) {
            // Only update store when dragging is complete
            storeUpdates.push(() => updateNode(change.id, { position: change.position }));
          }
          break;
        case 'remove':
          storeUpdates.push(() => removeNode(change.id));
          break;
        default:
          break;
      }
    });

    // Execute all store updates in a single batch
    if (storeUpdates.length > 0) {
      storeUpdates.forEach(update => update());
    }
  }, [onNodesChange, updateNode, removeNode]);

  // Enhanced edge change handler with batched updates
  const handleEdgesChange = useCallback((changes: EdgeChange<ConceptFlowEdge>[]) => {
    // Apply changes to React Flow state immediately for smooth interaction
    onEdgesChange(changes);
    
    // Batch store updates to avoid multiple re-renders
    const storeUpdates: Array<() => void> = [];
    
    changes.forEach(change => {
      switch (change.type) {
        case 'remove':
          storeUpdates.push(() => removeEdge(change.id));
          break;
        default:
          break;
      }
    });

    // Execute all store updates in a single batch
    if (storeUpdates.length > 0) {
      storeUpdates.forEach(update => update());
    }
  }, [onEdgesChange, removeEdge]);

  // Handle new connections with optimized edge creation
  const onConnect = useCallback((connection: Connection) => {
    const newEdge = handleConnection(connection, graphData.edges);
    
    if (newEdge) {
      addEdge(newEdge);
    }
  }, [graphData.edges, addEdge]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleNodeClick = useCallback((
    _event: React.MouseEvent,
    node: ConceptFlowNode
  ) => {
    console.log('🔵 Node clicked:', {
      nodeId: node.id,
      nodeTitle: node.data.title,
      event: _event.type
    });
    setSelectedNodeId(node.id);
    // Don't call setSelectedEdgeId(null) here - let the store handle clearing the edge
    console.log('🔵 After setSelectedNodeId called with:', node.id);
  }, [setSelectedNodeId]);

  const handleEdgeClick = useCallback((
    _event: React.MouseEvent,
    edge: ConceptFlowEdge
  ) => {
    console.log('🔗 Edge clicked:', {
      edgeId: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      event: _event.type
    });
    setSelectedEdgeId(edge.id);
    // Don't call setSelectedNodeId(null) here - let the store handle clearing the node
    console.log('🔗 After setSelectedEdgeId called with:', edge.id);
  }, [setSelectedEdgeId]);

  const handlePaneClick = useCallback(() => {
    console.log('🌐 Pane clicked - clearing selections');
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    closeContextMenu();
  }, [setSelectedNodeId, setSelectedEdgeId, closeContextMenu]);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    
    // Get coordinates - works for both React.MouseEvent and MouseEvent
    const clientX = event.clientX;
    const clientY = event.clientY;
    
    // Find the nearest node for context
    const nearbyNode = graphData.nodes.find(node => {
      const nodePos = node.position || { x: 0, y: 0 };
      const distance = Math.sqrt(
        Math.pow(clientX - nodePos.x, 2) + Math.pow(clientY - nodePos.y, 2)
      );
      return distance < 150; // Within 150px
    });

    console.log('🎯 Right-clicked on pane at:', { x: clientX, y: clientY });
    
    createContextMenu({
      x: clientX,
      y: clientY,
      mode: viewState.mode,
      nearbyNodeId: nearbyNode?.id,
    });
  }, [graphData.nodes, viewState.mode, createContextMenu]);

  const handleNodeDoubleClick = useCallback((
    _event: React.MouseEvent,
    node: ConceptFlowNode
  ) => {
    console.log('🎯 Double-clicked node for refocusing:', node.data.title);
    focusOnNode(node.id);
  }, [focusOnNode]);

  // Memoized fit view options for stable reference
  const fitViewOptions = useMemo(() => ({
    padding: 50,
    maxZoom: 1.5,
    minZoom: 0.1,
  }), []);

  // Memoized connection line style for stable reference
  const connectionLineStyle = useMemo(() => ({
    strokeWidth: 2,
    stroke: '#64748b',
  }), []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        fitView
        fitViewOptions={fitViewOptions}
        minZoom={0.05}
        maxZoom={3}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={connectionLineStyle}
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
            // Return appropriate color based on concept type
            switch (conceptType) {
              case 'Field': return '#1976d2';
              case 'Theory': return '#3b82f6';
              case 'Algorithm': return '#f59e0b';
              case 'Tool': return '#10b981';
              case 'Person': return '#ef4444';
              default: return '#6b7280';
            }
          }}
          nodeStrokeWidth={2}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
};

export default MainCanvas; 