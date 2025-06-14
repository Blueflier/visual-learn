import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGraphStore } from './graphStore';
import type { ConceptNode, ConceptEdge, ConceptGraph } from '../types';

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Test helper functions
const createTestNode = (
  id: string,
  title: string,
  position?: { x: number; y: number }
): ConceptNode => ({
  id,
  title,
  explanation: `Explanation for ${title}`,
  keywords: ['test', 'keyword'],
  conceptType: 'Theory',
  position: position || { x: 0, y: 0 },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  resources: ['https://example.com'],
});

const createTestEdge = (id: string, source: string, target: string, label?: string): ConceptEdge => ({
  id,
  source,
  target,
  label,
});

const createTestGraph = (): ConceptGraph => ({
  nodes: [
    createTestNode('1', 'React', { x: 100, y: 100 }),
    createTestNode('2', 'Components', { x: 200, y: 200 }),
    createTestNode('3', 'State Management', { x: 300, y: 300 }),
  ],
  edges: [
    createTestEdge('e1-2', '1', '2', 'has'),
    createTestEdge('e2-3', '2', '3', 'uses'),
  ],
});

describe('Graph Store Export/Import', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useGraphStore.setState({
      graphData: { nodes: [], edges: [] },
      viewState: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        mode: 'exploration',
        rootConceptId: undefined,
      },
      selectedNodeIds: [],
      selectedEdgeIds: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedNode: null,
      selectedEdge: null,
      isSettingsPanelOpen: false,
      isDetailSidebarOpen: false,
    });
    consoleSpy.mockClear();
  });

  describe('exportToJSON', () => {
    it('should export graph data with proper structure', () => {
      const store = useGraphStore.getState();
      const testGraph = createTestGraph();
      
      // Load test data
      store.loadGraph(testGraph);
      store.setMode('focus');
      store.setRootConceptId('1');

      const exportedJson = store.exportToJSON();
      const exportedData = JSON.parse(exportedJson);

      expect(exportedData).toMatchObject({
        version: '1.0.0',
        exportedAt: expect.any(String),
        graphData: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              id: '1',
              title: 'React',
              explanation: 'Explanation for React',
              keywords: ['test', 'keyword'],
              conceptType: 'Theory',
              position: { x: 100, y: 100 },
              resources: ['https://example.com'],
            }),
          ]),
          edges: expect.arrayContaining([
            expect.objectContaining({
              id: 'e1-2',
              source: '1',
              target: '2',
              label: 'has',
            }),
          ]),
        },
        viewState: {
          mode: 'focus',
          rootConceptId: '1',
        },
        metadata: {
          nodeCount: 3,
          edgeCount: 2,
          conceptTypes: ['Theory'],
        },
      });

      // Verify it's valid JSON
      expect(() => JSON.parse(exportedJson)).not.toThrow();
    });

    it('should export empty graph correctly', () => {
      const store = useGraphStore.getState();
      const exportedJson = store.exportToJSON();
      const exportedData = JSON.parse(exportedJson);

      expect(exportedData.graphData.nodes).toHaveLength(0);
      expect(exportedData.graphData.edges).toHaveLength(0);
      expect(exportedData.metadata.nodeCount).toBe(0);
      expect(exportedData.metadata.edgeCount).toBe(0);
    });
  });

  describe('importFromJSON', () => {
    it('should import valid graph data successfully', async () => {
      const store = useGraphStore.getState();
      const testGraph = createTestGraph();
      
      const exportData = {
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        graphData: testGraph,
        viewState: {
          mode: 'exploration' as const,
          rootConceptId: '1',
        },
        metadata: {
          nodeCount: 3,
          edgeCount: 2,
          conceptTypes: ['Theory'],
        },
      };

      const result = await store.importFromJSON(JSON.stringify(exportData));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify the data was loaded correctly
      const state = useGraphStore.getState();
      expect(state.graphData.nodes).toHaveLength(3);
      expect(state.graphData.edges).toHaveLength(2);
      expect(state.viewState.mode).toBe('exploration');
      expect(state.viewState.rootConceptId).toBe('1');
      expect(state.selectedNodeIds).toHaveLength(0);
      expect(state.isDetailSidebarOpen).toBe(false);
    });

    it('should handle invalid JSON format', async () => {
      const store = useGraphStore.getState();
      const result = await store.importFromJSON('invalid json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON format');
    });

    it('should validate graph data structure', async () => {
      const store = useGraphStore.getState();
      
      const invalidData = {
        version: '1.0.0',
        graphData: {
          nodes: 'not an array',
          edges: [],
        },
      };

      const result = await store.importFromJSON(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid graph data format');
    });

    it('should validate node structure', async () => {
      const store = useGraphStore.getState();
      
      const invalidData = {
        version: '1.0.0',
        graphData: {
          nodes: [
            {
              id: '1',
              // missing title, explanation, keywords
            },
          ],
          edges: [],
        },
      };

      const result = await store.importFromJSON(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid node structure: missing required fields');
    });

    it('should detect duplicate node IDs', async () => {
      const store = useGraphStore.getState();
      
      const invalidData = {
        version: '1.0.0',
        graphData: {
          nodes: [
            createTestNode('1', 'Test 1'),
            createTestNode('1', 'Test 2'), // Duplicate ID
          ],
          edges: [],
        },
      };

      const result = await store.importFromJSON(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Duplicate node ID found: 1');
    });

    it('should validate edge references to existing nodes', async () => {
      const store = useGraphStore.getState();
      
      const invalidData = {
        version: '1.0.0',
        graphData: {
          nodes: [createTestNode('1', 'Test 1')],
          edges: [createTestEdge('e1', '1', '999')], // Non-existent target
        },
      };

      const result = await store.importFromJSON(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Edge e1 references non-existent node(s)');
    });
  });

  describe('loadGraph', () => {
    it('should load graph and reset selection state', () => {
      const store = useGraphStore.getState();
      const testGraph = createTestGraph();
      
      // Set some selection state first
      store.setSelectedNodeId('1');
      store.setDetailSidebarOpen(true);
      store.setRootConceptId('2');

      store.loadGraph(testGraph);

      const state = useGraphStore.getState();
      expect(state.graphData.nodes).toHaveLength(3);
      expect(state.graphData.edges).toHaveLength(2);
      expect(state.selectedNodeIds).toHaveLength(0);
      expect(state.selectedNodeId).toBeNull();
      expect(state.selectedNode).toBeNull();
      expect(state.isDetailSidebarOpen).toBe(false);
      expect(state.viewState.rootConceptId).toBeUndefined();
    });
  });
}); 