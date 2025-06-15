import type { Selectors, StoreGet } from './types';

export const createSelectors = (get: StoreGet): Selectors => ({
  // Node selectors
  getNodeById: (nodeId: string) => {
    const state = get();
    return state.graphData.nodes.find(node => node.id === nodeId);
  },

  getNodesByIds: (nodeIds: string[]) => {
    const state = get();
    return state.graphData.nodes.filter(node => nodeIds.includes(node.id));
  },

  getSelectedNodes: () => {
    const state = get();
    return state.getNodesByIds(state.selectedNodeIds);
  },

  // Edge selectors
  getEdgeById: (edgeId: string) => {
    const state = get();
    return state.graphData.edges.find(edge => edge.id === edgeId);
  },

  getEdgesByIds: (edgeIds: string[]) => {
    const state = get();
    return state.graphData.edges.filter(edge => edgeIds.includes(edge.id));
  },

  getSelectedEdges: () => {
    const state = get();
    return state.getEdgesByIds(state.selectedEdgeIds);
  },

  // Graph query selectors
  getConnectedNodes: (nodeId: string) => {
    const state = get();
    const connectedNodeIds = new Set<string>();
    
    state.graphData.edges.forEach(edge => {
      if (edge.source === nodeId) {
        connectedNodeIds.add(edge.target);
      } else if (edge.target === nodeId) {
        connectedNodeIds.add(edge.source);
      }
    });

    return state.graphData.nodes.filter(node => connectedNodeIds.has(node.id));
  },

  getEdgesBetweenNodes: (sourceId: string, targetId: string) => {
    const state = get();
    return state.graphData.edges.filter(edge => 
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId)
    );
  },

  getNodeEdges: (nodeId: string) => {
    const state = get();
    return state.graphData.edges.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    );
  },

  // Selection state selectors
  isNodeSelected: (nodeId: string) => {
    const state = get();
    return state.selectedNodeIds.includes(nodeId);
  },

  isEdgeSelected: (edgeId: string) => {
    const state = get();
    return state.selectedEdgeIds.includes(edgeId);
  },

  hasSelection: () => {
    const state = get();
    return state.selectedNodeIds.length > 0 || state.selectedEdgeIds.length > 0;
  },

  getSelectionCount: () => {
    const state = get();
    return {
      nodes: state.selectedNodeIds.length,
      edges: state.selectedEdgeIds.length,
    };
  },
}); 