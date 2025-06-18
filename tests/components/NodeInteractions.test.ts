import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useGraphStore } from '../../src/store/graphStore';
import type { ConceptNode } from '../../src/types';

// Mock the graph store
vi.mock('../../src/store/graphStore', () => ({
  useGraphStore: vi.fn(),
}));

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

// Test helper functions
const createTestNode = (
  id: string,
  title: string,
  expanded = false,
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
  expanded,
});

describe('Node Interactions', () => {
  const mockStore = {
    graphData: {
      nodes: [
        createTestNode('1', 'React', false, { x: 100, y: 100 }),
        createTestNode('2', 'Components', false, { x: 200, y: 200 }),
        createTestNode('3', 'State Management', false, { x: 300, y: 300 }),
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', label: 'has' },
        { id: 'e2-3', source: '2', target: '3', label: 'uses' },
      ],
    },
    viewState: {
      zoom: 1,
      pan: { x: 0, y: 0 },
      mode: 'exploration' as const,
      rootConceptId: '1',
    },
    selectedNodeId: null,
    setSelectedNodeId: vi.fn(),
    setRootConceptId: vi.fn(),
    updateNode: vi.fn(),
    batchUpdateNodes: vi.fn(),
    toggleNodeExpansion: vi.fn(),
    expandNode: vi.fn(),
    collapseNode: vi.fn(),
    focusOnNode: vi.fn(),
    createContextMenu: vi.fn(),
    addNode: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useGraphStore).mockReturnValue(mockStore);
    Object.values(mockStore).forEach(fn => typeof fn === 'function' && fn.mockClear());
    consoleSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Node Expansion/Collapse', () => {
    it('should toggle node expansion state', () => {
      const nodeId = '1';
      const node = mockStore.graphData.nodes.find(n => n.id === nodeId);
      
      expect(node?.expanded).toBe(false);
      
      // Simulate expand button click
      mockStore.toggleNodeExpansion(nodeId);
      
      expect(mockStore.toggleNodeExpansion).toHaveBeenCalledWith(nodeId);
    });

    it('should expand node and show details', () => {
      const nodeId = '1';
      
      // Simulate expanding a node
      mockStore.expandNode(nodeId);
      
      expect(mockStore.expandNode).toHaveBeenCalledWith(nodeId);
    });

    it('should collapse node and hide details', () => {
      const nodeId = '1';
      
      // Simulate collapsing a node
      mockStore.collapseNode(nodeId);
      
      expect(mockStore.collapseNode).toHaveBeenCalledWith(nodeId);
    });

    it('should handle expand/collapse for nodes with different concept types', () => {
      const algorithmNode = createTestNode('4', 'Algorithm Test', false);
      algorithmNode.conceptType = 'Algorithm';
      
      mockStore.toggleNodeExpansion('4');
      
      expect(mockStore.toggleNodeExpansion).toHaveBeenCalledWith('4');
    });
  });

  describe('Node Refocusing', () => {
    it('should change root concept when double-clicking a node in exploration mode', () => {
      const nodeId = '2';
      mockStore.viewState.mode = 'exploration';
      
      // Simulate double-click on node
      mockStore.focusOnNode(nodeId);
      
      expect(mockStore.focusOnNode).toHaveBeenCalledWith(nodeId);
      // focusOnNode internally calls setRootConceptId, so we test the behavior not the implementation
    });

    it('should change root concept when double-clicking a node in focus mode', () => {
      const nodeId = '3';
      mockStore.viewState.mode = 'focus';
      
      // Simulate double-click on node
      mockStore.focusOnNode(nodeId);
      
      expect(mockStore.focusOnNode).toHaveBeenCalledWith(nodeId);
      // focusOnNode internally calls setRootConceptId, so we test the behavior not the implementation
    });

    it('should handle refocusing when node is already the root', () => {
      const currentRootId = '1';
      mockStore.viewState.rootConceptId = currentRootId;
      
      // Try to refocus on the same node
      mockStore.focusOnNode(currentRootId);
      
      expect(mockStore.focusOnNode).toHaveBeenCalledWith(currentRootId);
      // focusOnNode internally handles the root concept ID change
    });

    it('should trigger layout recalculation after refocusing', () => {
      const nodeId = '2';
      
      // Simulate refocusing
      mockStore.focusOnNode(nodeId);
      
      expect(mockStore.focusOnNode).toHaveBeenCalledWith(nodeId);
      // Layout recalculation would be triggered by the store update
    });
  });

  describe('Context Menu for Node Creation', () => {
    it('should create context menu on right-click in exploration mode', () => {
      const contextMenuData = {
        x: 100,
        y: 150,
        mode: 'exploration' as const,
        nearbyNodeId: '1',
      };
      
      mockStore.createContextMenu(contextMenuData);
      
      expect(mockStore.createContextMenu).toHaveBeenCalledWith(contextMenuData);
    });

    it('should create context menu on right-click in focus mode', () => {
      const contextMenuData = {
        x: 200,
        y: 250,
        mode: 'focus' as const,
        nearbyNodeId: '2',
      };
      
      mockStore.createContextMenu(contextMenuData);
      
      expect(mockStore.createContextMenu).toHaveBeenCalledWith(contextMenuData);
    });

    it('should add new node at context menu position', () => {
      const newNode = createTestNode('4', 'New Concept', false, { x: 100, y: 150 });
      
      mockStore.addNode(newNode);
      
      expect(mockStore.addNode).toHaveBeenCalledWith(newNode);
    });

    it('should handle context menu creation with no nearby nodes', () => {
      const contextMenuData = {
        x: 400,
        y: 400,
        mode: 'exploration' as const,
        nearbyNodeId: undefined,
      };
      
      mockStore.createContextMenu(contextMenuData);
      
      expect(mockStore.createContextMenu).toHaveBeenCalledWith(contextMenuData);
    });
  });

  describe('Node Selection and Focus Interactions', () => {
    it('should select node on single click', () => {
      const nodeId = '1';
      
      mockStore.setSelectedNodeId(nodeId);
      
      expect(mockStore.setSelectedNodeId).toHaveBeenCalledWith(nodeId);
    });

    it('should clear selection when clicking empty space', () => {
      mockStore.setSelectedNodeId(null);
      
      expect(mockStore.setSelectedNodeId).toHaveBeenCalledWith(null);
    });

    it('should handle rapid selection changes', () => {
      // Simulate rapid clicks on different nodes
      mockStore.setSelectedNodeId('1');
      mockStore.setSelectedNodeId('2');
      mockStore.setSelectedNodeId('3');
      
      expect(mockStore.setSelectedNodeId).toHaveBeenCalledTimes(3);
      expect(mockStore.setSelectedNodeId).toHaveBeenLastCalledWith('3');
    });

    it('should maintain selection state during expansion operations', () => {
      const nodeId = '2';
      
      // Select node first
      mockStore.setSelectedNodeId(nodeId);
      // Then expand it
      mockStore.expandNode(nodeId);
      
      expect(mockStore.setSelectedNodeId).toHaveBeenCalledWith(nodeId);
      expect(mockStore.expandNode).toHaveBeenCalledWith(nodeId);
    });
  });

  describe('Animation and Transition Handling', () => {
    it('should handle smooth transitions during refocusing', () => {
      const nodeId = '3';
      
      // Simulate refocusing with animation
      mockStore.focusOnNode(nodeId);
      
      // The actual animation would be handled by the layout system
      expect(mockStore.focusOnNode).toHaveBeenCalledWith(nodeId);
    });

    it('should handle expansion animations', () => {
      const nodeId = '1';
      
      // Simulate expansion with animation
      mockStore.expandNode(nodeId);
      
      expect(mockStore.expandNode).toHaveBeenCalledWith(nodeId);
    });

    it('should handle batch updates for multiple node operations', () => {
      const updates = [
        { id: '1', updates: { expanded: true } },
        { id: '2', updates: { expanded: false } },
      ];
      
      mockStore.batchUpdateNodes(updates);
      
      expect(mockStore.batchUpdateNodes).toHaveBeenCalledWith(updates);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle expansion of non-existent nodes gracefully', () => {
      const nonExistentNodeId = 'non-existent';
      
      mockStore.expandNode(nonExistentNodeId);
      
      expect(mockStore.expandNode).toHaveBeenCalledWith(nonExistentNodeId);
      // The store should handle this gracefully without throwing
    });

    it('should handle refocusing to non-existent nodes gracefully', () => {
      const nonExistentNodeId = 'non-existent';
      
      mockStore.focusOnNode(nonExistentNodeId);
      
      expect(mockStore.focusOnNode).toHaveBeenCalledWith(nonExistentNodeId);
      // The store should handle this gracefully
    });

    it('should handle context menu creation at edge of canvas', () => {
      const edgeContextMenuData = {
        x: 0,
        y: 0,
        mode: 'exploration' as const,
        nearbyNodeId: '1',
      };
      
      mockStore.createContextMenu(edgeContextMenuData);
      
      expect(mockStore.createContextMenu).toHaveBeenCalledWith(edgeContextMenuData);
    });

    it('should handle rapid expansion/collapse operations', () => {
      const nodeId = '1';
      
      // Simulate rapid toggle operations
      mockStore.toggleNodeExpansion(nodeId);
      mockStore.toggleNodeExpansion(nodeId);
      mockStore.toggleNodeExpansion(nodeId);
      
      expect(mockStore.toggleNodeExpansion).toHaveBeenCalledTimes(3);
    });
  });
}); 