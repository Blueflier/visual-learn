import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { sampleGraphData } from '../utils/sampleData';

// Import types
import type { EnhancedAppState, Actions, Selectors } from './types';

// Import action creators
import {
  createNodeActions,
  createEdgeActions,
  createSelectionActions,
  createGraphActions,
  createUIActions,
} from './actions';

// Import selectors
import { createSelectors } from './selectors';

export const useGraphStore = create<EnhancedAppState & Actions & Selectors>()(
  subscribeWithSelector(
    persist(
      (set, get) => {
        // Create action instances
        const nodeActions = createNodeActions(set);
        const edgeActions = createEdgeActions(set);
        const selectionActions = createSelectionActions(set, get);
        const graphActions = createGraphActions(set, get);
        const uiActions = createUIActions(set);
        const selectors = createSelectors(get);

        return {
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

          // Spread all actions
          ...nodeActions,
          ...edgeActions,
          ...selectionActions,
          ...graphActions,
          ...uiActions,
          ...selectors,
        };
      },
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