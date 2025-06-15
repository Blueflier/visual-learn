import type { SelectionActions, StoreGet, StoreSet } from '../types';

export const createSelectionActions = (set: StoreSet, get: StoreGet): SelectionActions => ({
  // Legacy single selection methods (for backward compatibility)
  setSelectedNodeId: (nodeId: string | null) => {
    console.log('🏪 Store: setSelectedNodeId called with:', nodeId);
    try {
      const state = get();
      const node = nodeId ? state.graphData.nodes.find(n => n.id === nodeId) || null : null;
      console.log('🏪 Store: Found node:', node ? node.title : 'null');
      console.log('🏪 Store: Setting isDetailSidebarOpen to:', nodeId !== null);
      
      set(() => ({
        selectedNodeIds: nodeId ? [nodeId] : [],
        selectedEdgeIds: [],
        selectedNodeId: nodeId,
        selectedEdgeId: null,
        selectedNode: node,
        selectedEdge: null,
        isDetailSidebarOpen: nodeId !== null,
      }));
    } catch (error) {
      console.error('Failed to set selected node:', error);
    }
  },

  setSelectedEdgeId: (edgeId: string | null) => {
    console.log('🏪 Store: setSelectedEdgeId called with:', edgeId);
    try {
      const state = get();
      const edge = edgeId ? state.graphData.edges.find(e => e.id === edgeId) || null : null;
      console.log('🏪 Store: Found edge:', edge ? `${edge.source} -> ${edge.target}` : 'null');
      console.log('🏪 Store: Setting isDetailSidebarOpen to:', edgeId !== null);
      
      set(() => ({
        selectedEdgeIds: edgeId ? [edgeId] : [],
        selectedNodeIds: [],
        selectedEdgeId: edgeId,
        selectedNodeId: null,
        selectedEdge: edge,
        selectedNode: null,
        isDetailSidebarOpen: edgeId !== null,
      }));
    } catch (error) {
      console.error('Failed to set selected edge:', error);
    }
  },

  // Multi-selection methods
  setSelectedNodeIds: (nodeIds: string[]) => {
    try {
      const state = get();
      const singleNodeId = nodeIds.length === 1 ? nodeIds[0] : null;
      const selectedNode = singleNodeId ? state.graphData.nodes.find(n => n.id === singleNodeId) || null : null;
      
      set(() => ({
        selectedNodeIds: [...nodeIds],
        selectedEdgeIds: [],
        selectedNodeId: singleNodeId,
        selectedEdgeId: null,
        selectedNode: selectedNode,
        selectedEdge: null,
        isDetailSidebarOpen: nodeIds.length > 0,
      }));
    } catch (error) {
      console.error('Failed to set selected nodes:', error);
    }
  },

  setSelectedEdgeIds: (edgeIds: string[]) => {
    try {
      const state = get();
      const singleEdgeId = edgeIds.length === 1 ? edgeIds[0] : null;
      const selectedEdge = singleEdgeId ? state.graphData.edges.find(e => e.id === singleEdgeId) || null : null;
      
      set(() => ({
        selectedEdgeIds: [...edgeIds],
        selectedNodeIds: [],
        selectedEdgeId: singleEdgeId,
        selectedNodeId: null,
        selectedEdge: selectedEdge,
        selectedNode: null,
        isDetailSidebarOpen: edgeIds.length > 0,
      }));
    } catch (error) {
      console.error('Failed to set selected edges:', error);
    }
  },

  addToNodeSelection: (nodeId: string) => {
    try {
      set(state => {
        if (!state.selectedNodeIds.includes(nodeId)) {
          return {
            selectedNodeIds: [...state.selectedNodeIds, nodeId],
            selectedEdgeIds: [],
            isDetailSidebarOpen: true,
          };
        }
        return state;
      });
    } catch (error) {
      console.error('Failed to add to node selection:', error);
    }
  },

  removeFromNodeSelection: (nodeId: string) => {
    try {
      set(state => {
        const newSelectedNodeIds = state.selectedNodeIds.filter(id => id !== nodeId);
        return {
          selectedNodeIds: newSelectedNodeIds,
          isDetailSidebarOpen: newSelectedNodeIds.length > 0 || state.selectedEdgeIds.length > 0,
        };
      });
    } catch (error) {
      console.error('Failed to remove from node selection:', error);
    }
  },

  addToEdgeSelection: (edgeId: string) => {
    try {
      set(state => {
        if (!state.selectedEdgeIds.includes(edgeId)) {
          return {
            selectedEdgeIds: [...state.selectedEdgeIds, edgeId],
            selectedNodeIds: [],
            isDetailSidebarOpen: true,
          };
        }
        return state;
      });
    } catch (error) {
      console.error('Failed to add to edge selection:', error);
    }
  },

  removeFromEdgeSelection: (edgeId: string) => {
    try {
      set(state => {
        const newSelectedEdgeIds = state.selectedEdgeIds.filter(id => id !== edgeId);
        return {
          selectedEdgeIds: newSelectedEdgeIds,
          isDetailSidebarOpen: state.selectedNodeIds.length > 0 || newSelectedEdgeIds.length > 0,
        };
      });
    } catch (error) {
      console.error('Failed to remove from edge selection:', error);
    }
  },

  clearSelection: () => {
    try {
      set({
        selectedNodeIds: [],
        selectedEdgeIds: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        selectedNode: null,
        selectedEdge: null,
        isDetailSidebarOpen: false,
      });
    } catch (error) {
      console.error('Failed to clear selection:', error);
    }
  },
}); 