import type { ConceptNode } from '../../types';
import type { NodeActions, StoreGet, StoreSet } from '../types';

export const createNodeActions = (set: StoreSet, get: StoreGet): NodeActions => ({
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
}); 