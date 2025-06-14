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
    // CRUD operations for nodes
    addNode: (node: ConceptNode) => void;
    updateNode: (nodeId: string, updates: Partial<ConceptNode>) => void;
    removeNode: (nodeId: string) => void;
    batchUpdateNodes: (updates: Array<{ id: string; updates: Partial<ConceptNode> }>) => void;
    
    // CRUD operations for edges
    addEdge: (edge: ConceptEdge) => void;
    updateEdge: (edgeId: string, updates: Partial<ConceptEdge>) => void;
    removeEdge: (edgeId: string) => void;
    batchUpdateEdges: (updates: Array<{ id: string; updates: Partial<ConceptEdge> }>) => void;
    
    // Graph-level operations
    setRootConceptId: (nodeId?: string) => void;
    toggleMode: () => void;
    setMode: (mode: 'focus' | 'exploration') => void;
    clearGraph: () => void;
    
    // Single selection (legacy support)
    setSelectedNodeId: (nodeId: string | null) => void;
    setSelectedEdgeId: (edgeId: string | null) => void;
    
    // Multi-selection support
    setSelectedNodeIds: (nodeIds: string[]) => void;
    setSelectedEdgeIds: (edgeIds: string[]) => void;
    addToNodeSelection: (nodeId: string) => void;
    removeFromNodeSelection: (nodeId: string) => void;
    addToEdgeSelection: (edgeId: string) => void;
    removeFromEdgeSelection: (edgeId: string) => void;
    clearSelection: () => void;
    
    // UI state
    toggleSettingsPanel: () => void;
    toggleDetailSidebar: () => void;
    setDetailSidebarOpen: (open: boolean) => void;
}

// Enhanced state interface with multi-selection support
interface EnhancedAppState extends Omit<AppState, 'selectedNodeId' | 'selectedEdgeId'> {
    // Multi-selection arrays
    selectedNodeIds: string[];
    selectedEdgeIds: string[];
    
    // Legacy single selection (updated by actions)
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
}

// Derived state selectors
interface Selectors {
    // Node selectors
    getNodeById: (nodeId: string) => ConceptNode | undefined;
    getNodesByIds: (nodeIds: string[]) => ConceptNode[];
    getSelectedNodes: () => ConceptNode[];
    
    // Edge selectors
    getEdgeById: (edgeId: string) => ConceptEdge | undefined;
    getEdgesByIds: (edgeIds: string[]) => ConceptEdge[];
    getSelectedEdges: () => ConceptEdge[];
    
    // Graph query selectors
    getConnectedNodes: (nodeId: string) => ConceptNode[];
    getEdgesBetweenNodes: (sourceId: string, targetId: string) => ConceptEdge[];
    getNodeEdges: (nodeId: string) => ConceptEdge[];
    
    // Selection state selectors
    isNodeSelected: (nodeId: string) => boolean;
    isEdgeSelected: (edgeId: string) => boolean;
    hasSelection: () => boolean;
    getSelectionCount: () => { nodes: number; edges: number };
}

export const useGraphStore = create<EnhancedAppState & Actions & Selectors>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        graphData: sampleGraphData,
        viewState: {
          zoom: 1,
          pan: { x: 0, y: 0 },
          mode: 'exploration',
          rootConceptId: undefined,
        },
        
        // Multi-selection state
        selectedNodeIds: [],
        selectedEdgeIds: [],
        
        // Legacy single selection (updated by actions)
        selectedNodeId: null,
        selectedEdgeId: null,
        
        // Selected objects (updated by actions)
        selectedNode: null,
        selectedEdge: null,
        
        // UI state
        isSettingsPanelOpen: false,
        isDetailSidebarOpen: false,

        // CRUD Actions for Nodes
        addNode: (node: ConceptNode) => {
          try {
            set(state => ({
              graphData: {
                ...state.graphData,
                nodes: [...state.graphData.nodes, node],
              },
            }));
          } catch (error) {
            console.error('Failed to add node:', error);
          }
        },

        updateNode: (nodeId: string, updates: Partial<ConceptNode>) => {
          try {
            set(state => {
              const nodeIndex = state.graphData.nodes.findIndex(node => node.id === nodeId);
              if (nodeIndex === -1) {
                console.warn(`Node with id ${nodeId} not found`);
                return state;
              }

              const updatedNodes = [...state.graphData.nodes];
              updatedNodes[nodeIndex] = { 
                ...updatedNodes[nodeIndex], 
                ...updates, 
                updatedAt: new Date() 
              };

              return {
                graphData: {
                  ...state.graphData,
                  nodes: updatedNodes,
                },
              };
            });
          } catch (error) {
            console.error('Failed to update node:', error);
          }
        },

        batchUpdateNodes: (updates: Array<{ id: string; updates: Partial<ConceptNode> }>) => {
          try {
            set(state => {
              const updatedNodes = [...state.graphData.nodes];

              updates.forEach(({ id, updates: nodeUpdates }) => {
                const nodeIndex = updatedNodes.findIndex(node => node.id === id);
                if (nodeIndex !== -1) {
                  updatedNodes[nodeIndex] = {
                    ...updatedNodes[nodeIndex],
                    ...nodeUpdates,
                    updatedAt: new Date()
                  };
                } else {
                  console.warn(`Node with id ${id} not found during batch update`);
                }
              });

              return {
                graphData: {
                  ...state.graphData,
                  nodes: updatedNodes,
                },
              };
            });
          } catch (error) {
            console.error('Failed to batch update nodes:', error);
          }
        },
        
        removeNode: (nodeId: string) => {
          try {
            set(state => {
              // Remove node from selection if it's selected
              const newSelectedNodeIds = state.selectedNodeIds.filter(id => id !== nodeId);
              const newSelectedNodeId = newSelectedNodeIds.length === 1 ? newSelectedNodeIds[0] : null;
              const newSelectedNode = newSelectedNodeId ? 
                state.graphData.nodes.find(n => n.id === newSelectedNodeId && n.id !== nodeId) || null : null;

              return {
                graphData: {
                  ...state.graphData,
                  nodes: state.graphData.nodes.filter(node => node.id !== nodeId),
                  edges: state.graphData.edges.filter(
                    edge => edge.source !== nodeId && edge.target !== nodeId
                  ),
                },
                selectedNodeIds: newSelectedNodeIds,
                selectedNodeId: newSelectedNodeId,
                selectedNode: newSelectedNode,
                isDetailSidebarOpen: newSelectedNodeIds.length > 0 || state.selectedEdgeIds.length > 0,
              };
            });
          } catch (error) {
            console.error('Failed to remove node:', error);
          }
        },

        // CRUD Actions for Edges
        addEdge: (edge: ConceptEdge) => {
          try {
            set(state => ({
              graphData: {
                ...state.graphData,
                edges: [...state.graphData.edges, edge],
              },
            }));
          } catch (error) {
            console.error('Failed to add edge:', error);
          }
        },
        
        updateEdge: (edgeId: string, updates: Partial<ConceptEdge>) => {
          try {
            set(state => {
              const edgeIndex = state.graphData.edges.findIndex(edge => edge.id === edgeId);
              if (edgeIndex === -1) {
                console.warn(`Edge with id ${edgeId} not found`);
                return state;
              }

              const updatedEdges = [...state.graphData.edges];
              updatedEdges[edgeIndex] = { ...updatedEdges[edgeIndex], ...updates };

              return {
                graphData: {
                  ...state.graphData,
                  edges: updatedEdges,
                },
              };
            });
          } catch (error) {
            console.error('Failed to update edge:', error);
          }
        },

        batchUpdateEdges: (updates: Array<{ id: string; updates: Partial<ConceptEdge> }>) => {
          try {
            set(state => {
              const updatedEdges = [...state.graphData.edges];

              updates.forEach(({ id, updates: edgeUpdates }) => {
                const edgeIndex = updatedEdges.findIndex(edge => edge.id === id);
                if (edgeIndex !== -1) {
                  updatedEdges[edgeIndex] = {
                    ...updatedEdges[edgeIndex],
                    ...edgeUpdates
                  };
                } else {
                  console.warn(`Edge with id ${id} not found during batch update`);
                }
              });

              return {
                graphData: {
                  ...state.graphData,
                  edges: updatedEdges,
                },
              };
            });
          } catch (error) {
            console.error('Failed to batch update edges:', error);
          }
        },
        
        removeEdge: (edgeId: string) => {
          try {
            set(state => {
              // Remove edge from selection if it's selected
              const newSelectedEdgeIds = state.selectedEdgeIds.filter(id => id !== edgeId);
              const newSelectedEdgeId = newSelectedEdgeIds.length === 1 ? newSelectedEdgeIds[0] : null;
              const newSelectedEdge = newSelectedEdgeId ? 
                state.graphData.edges.find(e => e.id === newSelectedEdgeId && e.id !== edgeId) || null : null;

              return {
                graphData: {
                  ...state.graphData,
                  edges: state.graphData.edges.filter(edge => edge.id !== edgeId),
                },
                selectedEdgeIds: newSelectedEdgeIds,
                selectedEdgeId: newSelectedEdgeId,
                selectedEdge: newSelectedEdge,
                isDetailSidebarOpen: state.selectedNodeIds.length > 0 || newSelectedEdgeIds.length > 0,
              };
            });
          } catch (error) {
            console.error('Failed to remove edge:', error);
          }
        },

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

        // UI state actions
        toggleSettingsPanel: () => {
          try {
            set(state => ({ isSettingsPanelOpen: !state.isSettingsPanelOpen }));
          } catch (error) {
            console.error('Failed to toggle settings panel:', error);
          }
        },

        toggleDetailSidebar: () => {
          try {
            set(state => ({ isDetailSidebarOpen: !state.isDetailSidebarOpen }));
          } catch (error) {
            console.error('Failed to toggle detail sidebar:', error);
          }
        },

        setDetailSidebarOpen: (open: boolean) => {
          try {
            set({ isDetailSidebarOpen: open });
          } catch (error) {
            console.error('Failed to set detail sidebar state:', error);
          }
        },

        // Derived state selectors
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
        // Version the storage to handle schema changes
        version: 1,
      }
    )
  )
); 