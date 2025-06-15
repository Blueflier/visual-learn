import { describe, it, expect, beforeEach } from 'vitest';
import {
  ForceDirectedLayout,
  RadialLayout,
  GraphLayoutUtils,
  applyForceDirectedLayout,
  applyRadialLayout,
  applyLinearLayout,
  autoLayout,
  type LayoutConfig,
} from '../../src/utils/graphLayout';
import type { ConceptNode, ConceptEdge, ConceptGraph } from '../../src/types';

// Test data
const createTestNode = (id: string, x?: number, y?: number): ConceptNode => ({
  id,
  title: `Node ${id}`,
  explanation: `Description for node ${id}`,
  keywords: ['test'],
  position: x !== undefined && y !== undefined ? { x, y } : undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  resources: [],
});

const createTestEdge = (id: string, source: string, target: string): ConceptEdge => ({
  id,
  source,
  target,
  label: `Edge ${id}`,
});

const testNodes: ConceptNode[] = [
  createTestNode('1', 100, 100),
  createTestNode('2', 200, 100),
  createTestNode('3', 150, 200),
  createTestNode('4'), // No position
];

const testEdges: ConceptEdge[] = [
  createTestEdge('e1', '1', '2'),
  createTestEdge('e2', '2', '3'),
  createTestEdge('e3', '1', '3'),
];

const testGraph: ConceptGraph = {
  nodes: testNodes,
  edges: testEdges,
};

describe('ForceDirectedLayout', () => {
  it('should initialize positions for nodes without positions', () => {
    const layout = new ForceDirectedLayout(testNodes, testEdges);
    const result = layout.layout();
    
    // All nodes should have positions after layout
    result.forEach(node => {
      expect(node.position).toBeDefined();
      expect(typeof node.position!.x).toBe('number');
      expect(typeof node.position!.y).toBe('number');
    });
  });

  it('should respect custom configuration', () => {
    const config: LayoutConfig = {
      width: 400,
      height: 300,
      nodeSpacing: 50,
      iterations: 10,
      forceStrength: 0.2,
    };
    
    const layout = new ForceDirectedLayout(testNodes, testEdges, config);
    const result = layout.layout();
    
    // Nodes should be within bounds
    result.forEach(node => {
      expect(node.position!.x).toBeGreaterThanOrEqual(50);
      expect(node.position!.x).toBeLessThanOrEqual(350);
      expect(node.position!.y).toBeGreaterThanOrEqual(50);
      expect(node.position!.y).toBeLessThanOrEqual(250);
    });
  });

  it('should handle empty graph', () => {
    const layout = new ForceDirectedLayout([], []);
    const result = layout.layout();
    expect(result).toEqual([]);
  });

  it('should handle single node', () => {
    const singleNode = [createTestNode('1')];
    const layout = new ForceDirectedLayout(singleNode, []);
    const result = layout.layout();
    
    expect(result).toHaveLength(1);
    expect(result[0].position).toBeDefined();
  });
});

describe('RadialLayout', () => {
  it('should place root node at center', () => {
    const layout = new RadialLayout(testNodes, testEdges, '1');
    const result = layout.layout();
    
    const rootNode = result.find(n => n.id === '1');
    expect(rootNode).toBeDefined();
    expect(rootNode!.position!.x).toBe(400); // center x
    expect(rootNode!.position!.y).toBe(300); // center y
  });

  it('should arrange connected nodes in circles', () => {
    const layout = new RadialLayout(testNodes, testEdges, '1');
    const result = layout.layout();
    
    const rootNode = result.find(n => n.id === '1')!;
    const connectedNodes = result.filter(n => n.id !== '1');
    
    // Connected nodes should be at some distance from root
    connectedNodes.forEach(node => {
      const dx = node.position!.x - rootNode.position!.x;
      const dy = node.position!.y - rootNode.position!.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      expect(distance).toBeGreaterThan(0);
    });
  });

  it('should handle disconnected nodes', () => {
    const disconnectedNode = createTestNode('5');
    const nodesWithDisconnected = [...testNodes, disconnectedNode];
    
    const layout = new RadialLayout(nodesWithDisconnected, testEdges, '1');
    const result = layout.layout();
    
    const disconnected = result.find(n => n.id === '5');
    expect(disconnected).toBeDefined();
    expect(disconnected!.position).toBeDefined();
  });

  it('should respect custom radius configuration', () => {
    const config: LayoutConfig = {
      width: 800,
      height: 600,
      nodeSpacing: 100,
      radius: 100,
    };
    
    const layout = new RadialLayout(testNodes, testEdges, '1', config);
    const result = layout.layout();
    
    // Check that nodes are positioned according to custom radius
    const rootNode = result.find(n => n.id === '1')!;
    const firstLevelNodes = result.filter(n => 
      testEdges.some(e => 
        (e.source === '1' && e.target === n.id) || 
        (e.target === '1' && e.source === n.id)
      )
    );
    
    firstLevelNodes.forEach(node => {
      const dx = node.position!.x - rootNode.position!.x;
      const dy = node.position!.y - rootNode.position!.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      expect(distance).toBeCloseTo(80, 0); // radius * 0.8
    });
  });
});

describe('GraphLayoutUtils', () => {
  describe('getNodeOverlap', () => {
    it('should detect overlapping nodes', () => {
      const nodeA = createTestNode('a', 100, 100);
      const nodeB = createTestNode('b', 110, 100); // 10 units apart
      
      const overlap = GraphLayoutUtils.getNodeOverlap(nodeA, nodeB, 30);
      expect(overlap).toBe(50); // 60 (min distance) - 10 (actual distance)
    });

    it('should return 0 for non-overlapping nodes', () => {
      const nodeA = createTestNode('a', 100, 100);
      const nodeB = createTestNode('b', 200, 100); // 100 units apart
      
      const overlap = GraphLayoutUtils.getNodeOverlap(nodeA, nodeB, 30);
      expect(overlap).toBe(0);
    });

    it('should handle nodes without positions', () => {
      const nodeA = createTestNode('a');
      const nodeB = createTestNode('b');
      
      const overlap = GraphLayoutUtils.getNodeOverlap(nodeA, nodeB);
      expect(overlap).toBe(0);
    });
  });

  describe('resolveOverlaps', () => {
    it('should separate overlapping nodes', () => {
      const overlappingNodes = [
        createTestNode('a', 100, 100),
        createTestNode('b', 105, 100), // Very close
        createTestNode('c', 200, 100), // Far away
      ];
      
      const resolved = GraphLayoutUtils.resolveOverlaps(overlappingNodes, 30);
      
      // Nodes a and b should be separated
      const nodeA = resolved.find(n => n.id === 'a')!;
      const nodeB = resolved.find(n => n.id === 'b')!;
      const nodeC = resolved.find(n => n.id === 'c')!;
      
      const distance = Math.sqrt(
        Math.pow(nodeA.position!.x - nodeB.position!.x, 2) +
        Math.pow(nodeA.position!.y - nodeB.position!.y, 2)
      );
      
      expect(distance).toBeGreaterThanOrEqual(60); // 2 * radius
      expect(nodeC.position!.x).toBe(200); // Should remain unchanged
    });
  });

  describe('calculateOptimalSpacing', () => {
    it('should calculate reasonable spacing based on node count and canvas size', () => {
      const spacing = GraphLayoutUtils.calculateOptimalSpacing(10, 800, 600);
      expect(spacing).toBeGreaterThanOrEqual(60);
      expect(spacing).toBeLessThanOrEqual(200);
    });

    it('should return minimum spacing for high node density', () => {
      const spacing = GraphLayoutUtils.calculateOptimalSpacing(1000, 800, 600);
      expect(spacing).toBe(60);
    });

    it('should return maximum spacing for low node density', () => {
      const spacing = GraphLayoutUtils.calculateOptimalSpacing(1, 800, 600);
      expect(spacing).toBe(200);
    });
  });

  describe('savePositions and restorePositions', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should save and restore node positions', () => {
      const nodes = [
        createTestNode('1', 100, 200),
        createTestNode('2', 300, 400),
      ];
      
      GraphLayoutUtils.savePositions('test-graph', nodes);
      
      const nodesWithoutPositions = [
        createTestNode('1'),
        createTestNode('2'),
      ];
      
      const restored = GraphLayoutUtils.restorePositions('test-graph', nodesWithoutPositions);
      
      expect(restored[0].position).toEqual({ x: 100, y: 200 });
      expect(restored[1].position).toEqual({ x: 300, y: 400 });
    });

    it('should handle missing saved positions', () => {
      const nodes = [createTestNode('1', 100, 200)];
      const restored = GraphLayoutUtils.restorePositions('nonexistent-graph', nodes);
      
      expect(restored).toEqual(nodes);
    });

    it('should handle corrupted saved data', () => {
      localStorage.setItem('graph-positions-test', 'invalid-json');
      
      const nodes = [createTestNode('1', 100, 200)];
      const restored = GraphLayoutUtils.restorePositions('test', nodes);
      
      expect(restored).toEqual(nodes);
    });
  });

  describe('calculateOptimalView', () => {
    it('should calculate zoom and pan to fit all nodes', () => {
      const nodes = [
        createTestNode('1', 0, 0),
        createTestNode('2', 400, 300),
      ];
      
      const view = GraphLayoutUtils.calculateOptimalView(nodes, 800, 600);
      
      expect(view.zoom).toBeGreaterThan(0);
      expect(view.zoom).toBeLessThanOrEqual(2);
      expect(view.pan).toBeDefined();
    });

    it('should handle empty node list', () => {
      const view = GraphLayoutUtils.calculateOptimalView([], 800, 600);
      
      expect(view.zoom).toBe(1);
      expect(view.pan).toEqual({ x: 0, y: 0 });
    });

    it('should handle nodes without positions', () => {
      const nodes = [createTestNode('1'), createTestNode('2')];
      const view = GraphLayoutUtils.calculateOptimalView(nodes, 800, 600);
      
      expect(view.zoom).toBe(1);
      expect(view.pan).toEqual({ x: 0, y: 0 });
    });
  });

  describe('createLinearLayout', () => {
    it('should arrange nodes in a horizontal line', () => {
      const nodes = [
        createTestNode('1'),
        createTestNode('2'),
        createTestNode('3'),
      ];
      
      const linear = GraphLayoutUtils.createLinearLayout(nodes, 800, 600, 100);
      
      // All nodes should have the same y position (center)
      linear.forEach(node => {
        expect(node.position!.y).toBe(300);
      });
      
      // Nodes should be spaced 100 units apart
      expect(linear[1].position!.x - linear[0].position!.x).toBe(100);
      expect(linear[2].position!.x - linear[1].position!.x).toBe(100);
    });

    it('should center the line horizontally', () => {
      const nodes = [createTestNode('1'), createTestNode('2')];
      const linear = GraphLayoutUtils.createLinearLayout(nodes, 800, 600, 100);
      
      const totalWidth = 100; // (2-1) * spacing
      const expectedStartX = (800 - totalWidth) / 2;
      
      expect(linear[0].position!.x).toBe(expectedStartX);
      expect(linear[1].position!.x).toBe(expectedStartX + 100);
    });
  });
});

describe('High-level layout functions', () => {
  describe('applyForceDirectedLayout', () => {
    it('should apply force-directed layout to graph', () => {
      const result = applyForceDirectedLayout(testGraph);
      
      expect(result.nodes).toHaveLength(testNodes.length);
      expect(result.edges).toEqual(testEdges);
      
      result.nodes.forEach(node => {
        expect(node.position).toBeDefined();
      });
    });
  });

  describe('applyRadialLayout', () => {
    it('should apply radial layout to graph', () => {
      const result = applyRadialLayout(testGraph, '1');
      
      expect(result.nodes).toHaveLength(testNodes.length);
      expect(result.edges).toEqual(testEdges);
      
      const rootNode = result.nodes.find(n => n.id === '1');
      expect(rootNode!.position!.x).toBe(400);
      expect(rootNode!.position!.y).toBe(300);
    });
  });

  describe('applyLinearLayout', () => {
    it('should apply linear layout to nodes', () => {
      const result = applyLinearLayout(testNodes, 800, 600);
      
      expect(result).toHaveLength(testNodes.length);
      result.forEach(node => {
        expect(node.position!.y).toBe(300);
      });
    });
  });

  describe('autoLayout', () => {
    it('should apply linear layout for focus mode', () => {
      const result = autoLayout(testGraph, 'focus', 800, 600);
      
      // All nodes should have same y position in focus mode
      const yPositions = result.nodes.map(n => n.position!.y);
      const uniqueY = new Set(yPositions);
      expect(uniqueY.size).toBe(1);
    });

    it('should apply radial layout for exploration mode with root', () => {
      const result = autoLayout(testGraph, 'exploration', 800, 600, '1');
      
      const rootNode = result.nodes.find(n => n.id === '1');
      expect(rootNode!.position!.x).toBe(400);
      expect(rootNode!.position!.y).toBe(300);
    });

    it('should apply force-directed layout for exploration mode without root', () => {
      const result = autoLayout(testGraph, 'exploration', 800, 600);
      
      // Should have applied some layout (positions should be defined)
      result.nodes.forEach(node => {
        expect(node.position).toBeDefined();
      });
    });
  });
});

describe('Animation utilities', () => {
  describe('animateToPositions', () => {
    it('should call onUpdate with interpolated positions', () => {
      return new Promise<void>((resolve) => {
        const currentNodes = [createTestNode('1', 0, 0)];
        const targetNodes = [createTestNode('1', 100, 100)];
        
        let updateCount = 0;
        
        GraphLayoutUtils.animateToPositions(
          currentNodes,
          targetNodes,
          100, // Short duration for test
          (nodes) => {
            updateCount++;
            expect(nodes[0].position).toBeDefined();
            
            // On final update, position should be close to target
            if (updateCount > 5) {
              expect(nodes[0].position!.x).toBeCloseTo(100, 0);
              expect(nodes[0].position!.y).toBeCloseTo(100, 0);
              resolve();
            }
          }
        );
      });
    });
  });
}); 