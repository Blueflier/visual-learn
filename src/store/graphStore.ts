import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppState,
  ConceptNode,
  ConceptEdge,
} from '../types';
import { sampleGraphData } from '../utils/sampleData';

interface Actions {
    addNode: (node: ConceptNode) => void;
    updateNode: (nodeId: string, updates: Partial<ConceptNode>) => void;
    removeNode: (nodeId: string) => void;
    addEdge: (edge: ConceptEdge) => void;
    updateEdge: (edgeId: string, updates: Partial<ConceptEdge>) => void;
    removeEdge: (edgeId: string) => void;
    setRootConceptId: (nodeId?: string) => void;
    toggleMode: () => void;
    setSelectedNodeId: (nodeId: string | null) => void;
    setSelectedEdgeId: (edgeId: string | null) => void;
    toggleSettingsPanel: () => void;
    toggleDetailSidebar: () => void;
}

export const useGraphStore = create<AppState & Actions>()(
  persist(
    (set, get) => ({
      graphData: sampleGraphData,
      viewState: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        mode: 'exploration',
        rootConceptId: undefined,
      },
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedNode: null,
      selectedEdge: null,
      isSettingsPanelOpen: false,
      isDetailSidebarOpen: false,

      // Actions
      addNode: (node: ConceptNode) =>
        set(state => ({
          graphData: {
            ...state.graphData,
            nodes: [...state.graphData.nodes, node],
          },
        })),

      updateNode: (nodeId: string, updates: Partial<ConceptNode>) =>
        set(state => {
          const updatedNodes = state.graphData.nodes.map(node =>
            node.id === nodeId ? { ...node, ...updates, updatedAt: new Date() } : node
          );
          const newSelectedNode = 
            nodeId === state.selectedNodeId
            ? updatedNodes.find(n => n.id === nodeId) || null
            : state.selectedNode;

          return {
            graphData: {
              ...state.graphData,
              nodes: updatedNodes,
            },
            selectedNode: newSelectedNode
          };
        }),
      
      removeNode: (nodeId: string) =>
        set(state => {
            const newSelectedNodeId = nodeId === state.selectedNodeId ? null : state.selectedNodeId;
            const newSelectedNode = nodeId === state.selectedNodeId ? null : state.selectedNode;

            return {
                graphData: {
                    ...state.graphData,
                    nodes: state.graphData.nodes.filter(node => node.id !== nodeId),
                    edges: state.graphData.edges.filter(
                      edge => edge.source !== nodeId && edge.target !== nodeId
                    ),
                },
                selectedNodeId: newSelectedNodeId,
                selectedNode: newSelectedNode,
            }
        }),

      addEdge: (edge: ConceptEdge) =>
        set(state => ({
          graphData: {
            ...state.graphData,
            edges: [...state.graphData.edges, edge],
          },
        })),
      
      updateEdge: (edgeId: string, updates: Partial<ConceptEdge>) =>
        set(state => {
          const updatedEdges = state.graphData.edges.map(edge =>
            edge.id === edgeId ? { ...edge, ...updates } : edge
          );
          const newSelectedEdge = 
            edgeId === state.selectedEdgeId
            ? updatedEdges.find(e => e.id === edgeId) || null
            : state.selectedEdge;

          return {
            graphData: {
              ...state.graphData,
              edges: updatedEdges,
            },
            selectedEdge: newSelectedEdge
          };
        }),
      
      removeEdge: (edgeId: string) =>
        set(state => {
          const newSelectedEdgeId = edgeId === state.selectedEdgeId ? null : state.selectedEdgeId;
          const newSelectedEdge = edgeId === state.selectedEdgeId ? null : state.selectedEdge;

          return {
            graphData: {
              ...state.graphData,
              edges: state.graphData.edges.filter(edge => edge.id !== edgeId),
            },
            selectedEdgeId: newSelectedEdgeId,
            selectedEdge: newSelectedEdge,
          };
        }),

      setRootConceptId: (nodeId?: string) =>
        set(state => ({
          viewState: { ...state.viewState, rootConceptId: nodeId },
        })),

      toggleMode: () =>
        set(state => ({
          viewState: {
            ...state.viewState,
            mode: state.viewState.mode === 'exploration' ? 'focus' : 'exploration',
          },
        })),
      
      setSelectedNodeId: (nodeId: string | null) => {
        const node = get().graphData.nodes.find(n => n.id === nodeId) || null;
        set({ selectedNodeId: nodeId, selectedNode: node });
      },

      setSelectedEdgeId: (edgeId: string | null) => {
        const edge = get().graphData.edges.find(e => e.id === edgeId) || null;
        set({ selectedEdgeId: edgeId, selectedEdge: edge });
      },
      
      toggleSettingsPanel: () =>
        set(state => ({ isSettingsPanelOpen: !state.isSettingsPanelOpen })),

      toggleDetailSidebar: () =>
        set(state => ({ isDetailSidebarOpen: !state.isDetailSidebarOpen })),
    }),
    {
      name: 'visual-learn-graph-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
                return new Date(value as string);
            }
            return value;
        }
      }),
    }
  )
); 