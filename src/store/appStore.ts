import { create } from 'zustand';
import type { AppState, ConceptNode, ConceptGraph, GraphViewState } from '../types';
import { sampleGraphData } from '../utils/sampleData';

interface AppStoreActions {
  setGraphData: (graph: ConceptGraph) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  setViewState: (viewState: Partial<GraphViewState>) => void;
  toggleSettingsPanel: () => void;
  toggleDetailSidebar: () => void;
  addNode: (node: ConceptNode) => void;
  updateNode: (id: string, updates: Partial<ConceptNode>) => void;
  removeNode: (id: string) => void;
  setSelectedNode: (node: ConceptNode | null) => void;
}

export const useAppStore = create<AppState & AppStoreActions>((set, get) => ({
  // Initial state from the new AppState structure
  graphData: sampleGraphData, // Use sample data initially
  viewState: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    mode: 'exploration',
  },
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedNode: null,
  isSettingsPanelOpen: false,
  isDetailSidebarOpen: false,

  // Actions
  setGraphData: (graph) => set({ graphData: graph }),

  setSelectedNodeId: (nodeId) => {
    const nodes = get().graphData.nodes;
    const selectedNode = nodes.find(n => n.id === nodeId) || null;
    set({ selectedNodeId: nodeId, selectedNode });
  },
  
  setSelectedNode: (node: ConceptNode | null) => {
    set({ selectedNodeId: node?.id || null, selectedNode: node });
  },

  setSelectedEdgeId: (edgeId) => set({ selectedEdgeId: edgeId }),
  
  setViewState: (viewState) => set((state) => ({
      viewState: { ...state.viewState, ...viewState }
  })),

  toggleSettingsPanel: () => set((state) => ({ 
    isSettingsPanelOpen: !state.isSettingsPanelOpen 
  })),
  
  toggleDetailSidebar: () => set((state) => ({ 
    isDetailSidebarOpen: !state.isDetailSidebarOpen 
  })),
  
  addNode: (node) => set((state) => ({
    graphData: {
      ...state.graphData,
      nodes: [...state.graphData.nodes, node]
    }
  })),
  
  updateNode: (id, updates) => set((state) => ({
    graphData: {
      ...state.graphData,
      nodes: state.graphData.nodes.map(node =>
        node.id === id ? { ...node, ...updates, updatedAt: new Date() } : node
      )
    },
    // Also update the selectedNode if it's the one being updated
    selectedNode: state.selectedNodeId === id 
        ? { ...state.selectedNode, ...updates, updatedAt: new Date() } as ConceptNode
        : state.selectedNode
  })),
  
  removeNode: (id) => set((state) => {
    const newGraphData = {
      ...state.graphData,
      nodes: state.graphData.nodes.filter(node => node.id !== id),
      edges: state.graphData.edges.filter(edge => 
        edge.source !== id && edge.target !== id
      )
    };

    if (state.selectedNodeId === id) {
      return { 
        graphData: newGraphData,
        selectedNodeId: null,
        selectedNode: null 
      };
    }
    
    return { graphData: newGraphData };
  })
})); 