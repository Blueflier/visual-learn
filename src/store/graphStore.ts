import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
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
    batchUpdateEdges: (updates: Array<{ id: string; updates: Partial<ConceptEdge> }>) => void;
    batchUpdateNodes: (updates: Array<{ id: string; updates: Partial<ConceptNode> }>) => void;
    setRootConceptId: (nodeId?: string) => void;
    toggleMode: () => void;
    setSelectedNodeId: (nodeId: string | null) => void;
    setSelectedEdgeId: (edgeId: string | null) => void;
    toggleSettingsPanel: () => void;
    toggleDetailSidebar: () => void;
}

export const useGraphStore = create<AppState & Actions>()(
  subscribeWithSelector(
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
            const nodeIndex = state.graphData.nodes.findIndex(node => node.id === nodeId);
            if (nodeIndex === -1) return state;

            const updatedNodes = [...state.graphData.nodes];
            updatedNodes[nodeIndex] = { 
              ...updatedNodes[nodeIndex], 
              ...updates, 
              updatedAt: new Date() 
            };

            const newSelectedNode = 
              nodeId === state.selectedNodeId
              ? updatedNodes[nodeIndex]
              : state.selectedNode;

            return {
              graphData: {
                ...state.graphData,
                nodes: updatedNodes,
              },
              selectedNode: newSelectedNode
            };
          }),

        batchUpdateNodes: (updates: Array<{ id: string; updates: Partial<ConceptNode> }>) =>
          set(state => {
            const updatedNodes = [...state.graphData.nodes];
            let selectedNodeUpdated = false;

            updates.forEach(({ id, updates: nodeUpdates }) => {
              const nodeIndex = updatedNodes.findIndex(node => node.id === id);
              if (nodeIndex !== -1) {
                updatedNodes[nodeIndex] = {
                  ...updatedNodes[nodeIndex],
                  ...nodeUpdates,
                  updatedAt: new Date()
                };
                if (id === state.selectedNodeId) {
                  selectedNodeUpdated = true;
                }
              }
            });

            const newSelectedNode = selectedNodeUpdated && state.selectedNodeId
              ? updatedNodes.find(n => n.id === state.selectedNodeId) || null
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
            const edgeIndex = state.graphData.edges.findIndex(edge => edge.id === edgeId);
            if (edgeIndex === -1) return state;

            const updatedEdges = [...state.graphData.edges];
            updatedEdges[edgeIndex] = { ...updatedEdges[edgeIndex], ...updates };

            const newSelectedEdge = 
              edgeId === state.selectedEdgeId
              ? updatedEdges[edgeIndex]
              : state.selectedEdge;

            return {
              graphData: {
                ...state.graphData,
                edges: updatedEdges,
              },
              selectedEdge: newSelectedEdge
            };
          }),

        batchUpdateEdges: (updates: Array<{ id: string; updates: Partial<ConceptEdge> }>) =>
          set(state => {
            const updatedEdges = [...state.graphData.edges];
            let selectedEdgeUpdated = false;

            updates.forEach(({ id, updates: edgeUpdates }) => {
              const edgeIndex = updatedEdges.findIndex(edge => edge.id === id);
              if (edgeIndex !== -1) {
                updatedEdges[edgeIndex] = {
                  ...updatedEdges[edgeIndex],
                  ...edgeUpdates
                };
                if (id === state.selectedEdgeId) {
                  selectedEdgeUpdated = true;
                }
              }
            });

            const newSelectedEdge = selectedEdgeUpdated && state.selectedEdgeId
              ? updatedEdges.find(e => e.id === state.selectedEdgeId) || null
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
          const state = get();
          const node = nodeId ? state.graphData.nodes.find(n => n.id === nodeId) || null : null;
          set({ selectedNodeId: nodeId, selectedNode: node });
        },

        setSelectedEdgeId: (edgeId: string | null) => {
          const state = get();
          const edge = edgeId ? state.graphData.edges.find(e => e.id === edgeId) || null : null;
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
  )
); 