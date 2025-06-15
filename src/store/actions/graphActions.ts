import type { ConceptGraph } from '../../types';
import type { GraphActions, StoreGet, StoreSet } from '../types';

export const createGraphActions = (set: StoreSet, get: StoreGet): GraphActions => ({
  // Graph-level operations
  setRootConceptId: (nodeId?: string) => {
    try {
      set(state => ({
        viewState: { ...state.viewState, rootConceptId: nodeId },
      }));
    } catch (error) {
      console.error('Failed to set root concept:', error);
    }
  },

  toggleMode: () => {
    try {
      set(state => ({
        viewState: {
          ...state.viewState,
          mode: state.viewState.mode === 'exploration' ? 'focus' : 'exploration',
        },
      }));
    } catch (error) {
      console.error('Failed to toggle mode:', error);
    }
  },

  setMode: (mode: 'focus' | 'exploration') => {
    try {
      set(state => ({
        viewState: { ...state.viewState, mode },
      }));
    } catch (error) {
      console.error('Failed to set mode:', error);
    }
  },

  clearGraph: () => {
    try {
      set(state => ({
        graphData: {
          nodes: [],
          edges: [],
        },
        selectedNodeIds: [],
        selectedEdgeIds: [],
        isDetailSidebarOpen: false,
        viewState: {
          ...state.viewState,
          rootConceptId: undefined,
        },
      }));
    } catch (error) {
      console.error('Failed to clear graph:', error);
    }
  },

  // Import/Export operations
  exportToJSON: () => {
    try {
      const state = get();
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        graphData: state.graphData,
        viewState: {
          mode: state.viewState.mode,
          rootConceptId: state.viewState.rootConceptId,
        },
        metadata: {
          nodeCount: state.graphData.nodes.length,
          edgeCount: state.graphData.edges.length,
          conceptTypes: [...new Set(state.graphData.nodes.map(n => n.conceptType).filter(Boolean))],
        },
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export graph:', error);
      throw new Error('Failed to export graph data');
    }
  },

  importFromJSON: async (jsonString: string) => {
    try {
      const importData = JSON.parse(jsonString);
      
      // Validate the imported data structure
      if (!importData.graphData || !Array.isArray(importData.graphData.nodes) || !Array.isArray(importData.graphData.edges)) {
        return { success: false, error: 'Invalid graph data format' };
      }

      // Validate nodes have required fields
      for (const node of importData.graphData.nodes) {
        if (!node.id || !node.title || !node.explanation || !Array.isArray(node.keywords)) {
          return { success: false, error: 'Invalid node structure: missing required fields' };
        }
        // Ensure dates are properly converted
        if (node.createdAt) node.createdAt = new Date(node.createdAt);
        if (node.updatedAt) node.updatedAt = new Date(node.updatedAt);
        // Ensure resources is an array
        if (!Array.isArray(node.resources)) node.resources = [];
      }

      // Validate edges have required fields
      for (const edge of importData.graphData.edges) {
        if (!edge.id || !edge.source || !edge.target) {
          return { success: false, error: 'Invalid edge structure: missing required fields' };
        }
      }

      // Check for duplicate node IDs
      const nodeIds = new Set();
      for (const node of importData.graphData.nodes) {
        if (nodeIds.has(node.id)) {
          return { success: false, error: `Duplicate node ID found: ${node.id}` };
        }
        nodeIds.add(node.id);
      }

      // Check for duplicate edge IDs
      const edgeIds = new Set();
      for (const edge of importData.graphData.edges) {
        if (edgeIds.has(edge.id)) {
          return { success: false, error: `Duplicate edge ID found: ${edge.id}` };
        }
        edgeIds.add(edge.id);
      }

      // Validate edge references
      for (const edge of importData.graphData.edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
          return { success: false, error: `Edge ${edge.id} references non-existent node(s)` };
        }
      }

      // If validation passes, load the graph
      set(state => ({
        graphData: importData.graphData,
        viewState: {
          ...state.viewState,
          mode: importData.viewState?.mode || 'exploration',
          rootConceptId: importData.viewState?.rootConceptId,
        },
        selectedNodeIds: [],
        selectedEdgeIds: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        selectedNode: null,
        selectedEdge: null,
        isDetailSidebarOpen: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Failed to import graph:', error);
      if (error instanceof SyntaxError) {
        return { success: false, error: 'Invalid JSON format' };
      }
      return { success: false, error: 'Failed to import graph data' };
    }
  },

  loadGraph: (graph: ConceptGraph) => {
    try {
      set(state => ({
        graphData: graph,
        selectedNodeIds: [],
        selectedEdgeIds: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        selectedNode: null,
        selectedEdge: null,
        isDetailSidebarOpen: false,
        viewState: {
          ...state.viewState,
          rootConceptId: undefined,
        },
      }));
    } catch (error) {
      console.error('Failed to load graph:', error);
    }
  },
}); 