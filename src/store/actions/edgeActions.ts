import type { ConceptEdge } from '../../types';
import type { EdgeActions, StoreGet, StoreSet } from '../types';

export const createEdgeActions = (set: StoreSet, get: StoreGet): EdgeActions => ({
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
}); 