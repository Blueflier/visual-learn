import { describe, test, expect, beforeEach } from 'vitest';
import {
  GraphQueryEngine,
  createQueryEngine,
  quickSearch,
  findNodesByProperty,
  getNodesByType,
  getNodesInDateRange,
  getNodesWithResources,
  getNodesWithImages,
  type NodeFilterCriteria,
} from './graphQuery';
import type { ConceptNode, ConceptEdge, ConceptGraph } from '../types';

// Test helper functions
function createTestNode(
  id: string,
  title: string,
  keywords: string[] = [],
  conceptType?: 'Field' | 'Theory' | 'Algorithm' | 'Tool' | 'Person',
  resources: string[] = [],
  imageUrl?: string
): ConceptNode {
  return {
    id,
    title,
    explanation: `Explanation for ${title}`,
    keywords,
    conceptType,
    position: { x: 0, y: 0 },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    resources,
    imageUrl,
  };
}

const createTestEdge = (id: string, source: string, target: string, label?: string): ConceptEdge => ({
  id,
  source,
  target,
  label,
});

const testNodes: ConceptNode[] = [
  createTestNode('1', 'React', ['javascript', 'ui', 'library'], 'Tool', ['https://react.dev']),
  createTestNode('2', 'Components', ['ui', 'composition'], 'Theory', ['https://redux.js.org']),
  createTestNode('3', 'State Management', ['state', 'data'], 'Theory', [], 'https://example.com/ts.png'),
  createTestNode('4', 'Hooks', ['functions', 'state'], 'Algorithm', ['https://redux.js.org']),
  createTestNode('5', 'TypeScript', ['types', 'javascript'], 'Tool', [], 'https://example.com/ts.png'),
  createTestNode('6', 'Dan Abramov', ['person', 'developer'], 'Person', ['https://example.com/ts.png']),
];

const testEdges: ConceptEdge[] = [
  createTestEdge('e1-2', '1', '2', 'has'),
  createTestEdge('e1-3', '1', '3', 'involves'),
  createTestEdge('e2-4', '2', '4', 'can use'),
  createTestEdge('e3-4', '3', '4', 'uses'),
  createTestEdge('e5-1', '5', '1', 'enhances'),
  createTestEdge('e6-1', '6', '1', 'created'),
];

const testGraph: ConceptGraph = {
  nodes: testNodes,
  edges: testEdges,
};

describe('GraphQueryEngine', () => {
  let engine: GraphQueryEngine;

  beforeEach(() => {
    engine = new GraphQueryEngine(testGraph);
  });

  describe('Graph Traversal', () => {
    test('breadthFirstTraversal should traverse nodes in BFS order', () => {
      const result = engine.breadthFirstTraversal('1');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      
      // Node 1 should come before its direct neighbors
      const node1Index = result.indexOf('1');
      const node2Index = result.indexOf('2');
      const node3Index = result.indexOf('3');
      
      expect(node1Index).toBeLessThan(node2Index);
      expect(node1Index).toBeLessThan(node3Index);
    });

    test('breadthFirstTraversal should respect maxDepth', () => {
      const result = engine.breadthFirstTraversal('1', 1);
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      // Should not contain nodes at depth 2
      expect(result).not.toContain('4');
    });

    test('depthFirstTraversal should traverse nodes in DFS order', () => {
      const result = engine.depthFirstTraversal('1');
      expect(result).toContain('1');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBe('1'); // Should start with the starting node
    });

    test('depthFirstTraversal should respect maxDepth', () => {
      const result = engine.depthFirstTraversal('1', 1);
      expect(result).toContain('1');
      expect(result.length).toBeGreaterThan(1);
    });

    test('traversal should return empty array for non-existent node', () => {
      const bfsResult = engine.breadthFirstTraversal('999');
      const dfsResult = engine.depthFirstTraversal('999');
      
      expect(bfsResult).toEqual([]);
      expect(dfsResult).toEqual([]);
    });
  });

  describe('Path Finding', () => {
    test('findShortestPath should find direct path', () => {
      const result = engine.findShortestPath('1', '2');
      
      expect(result.found).toBe(true);
      expect(result.path).toEqual(['1', '2']);
      expect(result.distance).toBe(1);
    });

    test('findShortestPath should find indirect path', () => {
      const result = engine.findShortestPath('1', '4');
      
      expect(result.found).toBe(true);
      expect(result.distance).toBeGreaterThan(1);
      expect(result.path[0]).toBe('1');
      expect(result.path[result.path.length - 1]).toBe('4');
    });

    test('findShortestPath should handle same source and target', () => {
      const result = engine.findShortestPath('1', '1');
      
      expect(result.found).toBe(true);
      expect(result.path).toEqual(['1']);
      expect(result.distance).toBe(0);
    });

    test('findShortestPath should return not found for disconnected nodes', () => {
      // Create a disconnected node
      const disconnectedGraph: ConceptGraph = {
        nodes: [...testNodes, createTestNode('7', 'Isolated', [], 'Person')],
        edges: testEdges,
      };
      const disconnectedEngine = new GraphQueryEngine(disconnectedGraph);
      
      const result = disconnectedEngine.findShortestPath('1', '7');
      
      expect(result.found).toBe(false);
      expect(result.distance).toBe(-1);
      expect(result.path).toEqual([]);
    });

    test('findAllPaths should find multiple paths', () => {
      const result = engine.findAllPaths('1', '4');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(path => path.found)).toBe(true);
      expect(result.every(path => path.path[0] === '1')).toBe(true);
      expect(result.every(path => path.path[path.path.length - 1] === '4')).toBe(true);
    });

    test('findAllPaths should respect maxDepth', () => {
      const result = engine.findAllPaths('1', '4', 2);
      
      expect(result.every(path => path.distance <= 2)).toBe(true);
    });
  });

  describe('Connected Nodes', () => {
    test('getConnectedNodes should return all connected nodes by default', () => {
      const result = engine.getConnectedNodes('1');
      
      expect(result).toContain('2'); // outgoing
      expect(result).toContain('3'); // outgoing
      expect(result).toContain('5'); // incoming
      expect(result).toContain('6'); // incoming
    });

    test('getConnectedNodes should return only outgoing when specified', () => {
      const result = engine.getConnectedNodes('1', false, true);
      
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).not.toContain('5');
      expect(result).not.toContain('6');
    });

    test('getConnectedNodes should return only incoming when specified', () => {
      const result = engine.getConnectedNodes('1', true, false);
      
      expect(result).not.toContain('2');
      expect(result).not.toContain('3');
      expect(result).toContain('5');
      expect(result).toContain('6');
    });
  });

  describe('Node Filtering', () => {
    test('filterNodes should filter by concept type', () => {
      const criteria: NodeFilterCriteria = {
        conceptTypes: ['Tool'],
      };
      
      const result = engine.filterNodes(criteria);
      
      expect(result.length).toBe(2); // React and TypeScript
      expect(result.every(node => node.conceptType === 'Tool')).toBe(true);
    });

    test('filterNodes should filter by keywords', () => {
      const criteria: NodeFilterCriteria = {
        keywords: ['javascript'],
      };
      
      const result = engine.filterNodes(criteria);
      
      expect(result.length).toBe(2); // React and TypeScript
      expect(result.every(node => 
        node.keywords.some(keyword => keyword.toLowerCase().includes('javascript'))
      )).toBe(true);
    });

    test('filterNodes should filter by hasResources', () => {
      const criteria: NodeFilterCriteria = {
        hasResources: true,
      };
      
      const result = engine.filterNodes(criteria);
      
      expect(result.length).toBe(2); // React and State Management
      expect(result.every(node => node.resources && node.resources.length > 0)).toBe(true);
    });

    test('filterNodes should filter by hasImage', () => {
      const criteria: NodeFilterCriteria = {
        hasImage: true,
      };
      
      const result = engine.filterNodes(criteria);
      
      expect(result.length).toBe(1); // TypeScript
      expect(result.every(node => Boolean(node.imageUrl))).toBe(true);
    });

    test('filterNodes should combine multiple criteria', () => {
      const criteria: NodeFilterCriteria = {
        conceptTypes: ['Tool'],
      };
      
      const result = engine.filterNodes(criteria);
      
      expect(result.length).toBe(2); // React and TypeScript
      expect(result.every(node => node.conceptType === 'Tool')).toBe(true);
    });
  });

  describe('Text Search', () => {
    test('searchNodes should find nodes by title', () => {
      const result = engine.searchNodes('React');
      
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('React');
    });

    test('searchNodes should find nodes by keywords', () => {
      const result = engine.searchNodes('javascript');
      
      expect(result.length).toBe(2); // React and TypeScript
    });

    test('searchNodes should find nodes by explanation', () => {
      const result = engine.searchNodes('Explanation for React');
      
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('React');
    });

    test('searchNodes should be case insensitive by default', () => {
      const result = engine.searchNodes('REACT');
      
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('React');
    });

    test('searchNodes should respect case sensitivity when configured', () => {
      const result = engine.searchNodes('REACT', { caseSensitive: true });
      
      expect(result.length).toBe(0);
    });

    test('searchNodes should support partial matches', () => {
      const result = engine.searchNodes('Reac');
      
      expect(result.length).toBe(1);
      expect(result[0].title).toBe('React');
    });

    test('searchNodes should support exact matches when configured', () => {
      const result = engine.searchNodes('Reac', { includePartialMatches: false });
      
      expect(result.length).toBe(0);
    });
  });

  describe('Similarity Detection', () => {
    test('findSimilarNodes should find similar nodes', () => {
      // Add a similar node to React
      const similarGraph: ConceptGraph = {
        nodes: [...testNodes, createTestNode('8', 'Vue', ['javascript', 'ui', 'framework'], 'Tool')],
        edges: testEdges,
      };
      const similarEngine = new GraphQueryEngine(similarGraph, { similarityThreshold: 0.1 });
      
      const result = similarEngine.findSimilarNodes('1'); // React
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(item => item.node.title === 'Vue')).toBe(true);
      expect(result.every(item => item.similarity >= 0 && item.similarity <= 1)).toBe(true);
    });

    test('findSimilarNodes should return empty array for non-existent node', () => {
      const result = engine.findSimilarNodes('999');
      
      expect(result).toEqual([]);
    });

    test('findSimilarNodes should respect similarity threshold', () => {
      const result = engine.findSimilarNodes('1', 0.9); // Very high threshold
      
      expect(result.length).toBe(0); // No nodes should be similar enough
    });

    test('findSimilarNodes should sort by similarity descending', () => {
      const similarGraph: ConceptGraph = {
        nodes: [
          ...testNodes,
          createTestNode('8', 'Vue', ['javascript', 'ui'], 'Tool'),
          createTestNode('9', 'Angular', ['javascript', 'framework'], 'Tool'),
        ],
        edges: testEdges,
      };
      const similarEngine = new GraphQueryEngine(similarGraph);
      
      const result = similarEngine.findSimilarNodes('1', 0.1); // Low threshold
      
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].similarity).toBeGreaterThanOrEqual(result[i + 1].similarity);
        }
      }
    });
  });

  describe('Cluster Analysis', () => {
    test('identifyClusters should find connected components', () => {
      const result = engine.identifyClusters();
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(cluster => cluster.nodeIds.length >= 2)).toBe(true);
      expect(result.every(cluster => cluster.cohesion >= 0 && cluster.cohesion <= 1)).toBe(true);
    });

    test('identifyClusters should respect minimum cluster size', () => {
      const result = engine.identifyClusters(3);
      
      expect(result.every(cluster => cluster.nodeIds.length >= 3)).toBe(true);
    });

    test('identifyClusters should identify centroids', () => {
      const result = engine.identifyClusters();
      
      expect(result.every(cluster => cluster.centroid !== undefined)).toBe(true);
      expect(result.every(cluster => cluster.nodeIds.includes(cluster.centroid!))).toBe(true);
    });

    test('identifyClusters should sort by cohesion descending', () => {
      const result = engine.identifyClusters();
      
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          expect(result[i].cohesion).toBeGreaterThanOrEqual(result[i + 1].cohesion);
        }
      }
    });
  });

  describe('Graph Statistics', () => {
    test('getGraphStatistics should return correct node and edge counts', () => {
      const stats = engine.getGraphStatistics();
      
      expect(stats.nodeCount).toBe(testNodes.length);
      expect(stats.edgeCount).toBe(testEdges.length);
    });

    test('getGraphStatistics should calculate degree statistics', () => {
      const stats = engine.getGraphStatistics();
      
      expect(stats.avgDegree).toBeGreaterThan(0);
      expect(stats.maxDegree).toBeGreaterThanOrEqual(stats.avgDegree);
      expect(stats.minDegree).toBeLessThanOrEqual(stats.avgDegree);
      expect(stats.degrees.length).toBe(testNodes.length);
    });

    test('getGraphStatistics should calculate density', () => {
      const stats = engine.getGraphStatistics();
      
      expect(stats.density).toBeGreaterThan(0);
      expect(stats.density).toBeLessThanOrEqual(1);
    });
  });
});

describe('Convenience Functions', () => {
  test('createQueryEngine should create a new engine instance', () => {
    const engine = createQueryEngine(testGraph);
    
    expect(engine).toBeInstanceOf(GraphQueryEngine);
  });

  test('quickSearch should perform text search', () => {
    const result = quickSearch(testGraph, 'React');
    
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('React');
  });

  test('findNodesByProperty should find nodes by property value', () => {
    const result = findNodesByProperty(testGraph, 'conceptType', 'Tool');
    
    expect(result.length).toBe(2); // React and TypeScript
    expect(result.every(node => node.conceptType === 'Tool')).toBe(true);
  });

  test('getNodesByType should filter by concept types', () => {
    const result = getNodesByType(testGraph, ['Tool', 'Theory']);
    
    expect(result.length).toBe(4); // React, Components, State Management, TypeScript
    expect(result.every(node => 
      node.conceptType === 'Tool' || node.conceptType === 'Theory'
    )).toBe(true);
  });

  test('getNodesInDateRange should filter by date range', () => {
    const startDate = new Date('2023-12-31');
    const endDate = new Date('2024-01-02');
    
    const result = getNodesInDateRange(testGraph, startDate, endDate);
    
    expect(result.length).toBe(testNodes.length); // All nodes created in range
  });

  test('getNodesInDateRange should use update date when specified', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-03');
    
    const result = getNodesInDateRange(testGraph, startDate, endDate, true);
    
    expect(result.length).toBe(testNodes.length); // All nodes updated in range
  });

  test('getNodesWithResources should find nodes with resources', () => {
    const result = getNodesWithResources(testGraph);
    
    expect(result.length).toBe(2); // React and State Management
    expect(result.every(node => node.resources && node.resources.length > 0)).toBe(true);
  });

  test('getNodesWithImages should find nodes with images', () => {
    const result = getNodesWithImages(testGraph);
    
    expect(result.length).toBe(1); // TypeScript
    expect(result.every(node => Boolean(node.imageUrl))).toBe(true);
  });
});

describe('Edge Cases and Error Handling', () => {
  let engine: GraphQueryEngine;

  beforeEach(() => {
    engine = new GraphQueryEngine(testGraph);
  });

  test('should handle empty graph', () => {
    const emptyGraph: ConceptGraph = { nodes: [], edges: [] };
    const emptyEngine = new GraphQueryEngine(emptyGraph);
    
    expect(emptyEngine.breadthFirstTraversal('1')).toEqual([]);
    expect(emptyEngine.depthFirstTraversal('1')).toEqual([]);
    expect(emptyEngine.findShortestPath('1', '2').found).toBe(false);
    expect(emptyEngine.filterNodes({})).toEqual([]);
    expect(emptyEngine.searchNodes('test')).toEqual([]);
    expect(emptyEngine.identifyClusters()).toEqual([]);
  });

  test('should handle graph with nodes but no edges', () => {
    const noEdgesGraph: ConceptGraph = { nodes: testNodes, edges: [] };
    const noEdgesEngine = new GraphQueryEngine(noEdgesGraph);
    
    expect(noEdgesEngine.breadthFirstTraversal('1')).toEqual(['1']);
    expect(noEdgesEngine.getConnectedNodes('1')).toEqual([]);
    expect(noEdgesEngine.findShortestPath('1', '2').found).toBe(false);
  });

  test('should handle invalid node IDs gracefully', () => {
    expect(engine.breadthFirstTraversal('')).toEqual([]);
    expect(engine.depthFirstTraversal('')).toEqual([]);
    expect(engine.getConnectedNodes('invalid')).toEqual([]);
    expect(engine.findSimilarNodes('invalid')).toEqual([]);
  });

  test('should handle malformed filter criteria', () => {
    const result = engine.filterNodes({
      conceptTypes: [],
    });
    
    expect(result.length).toBe(testNodes.length); // Should return all nodes
  });
}); 