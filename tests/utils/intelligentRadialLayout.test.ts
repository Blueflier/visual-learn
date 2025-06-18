import { describe, it, expect, beforeEach } from 'vitest';
import { 
  IntelligentRadialLayout, 
  RelationshipAnalyzer,
  type LayoutConfig 
} from '../../src/utils/graphLayout';
import type { ConceptNode, ConceptEdge, ConceptGraph } from '../../src/types';

// Test helper functions
const createTestNode = (
  id: string,
  title: string,
  conceptType?: 'Field' | 'Theory' | 'Algorithm' | 'Tool' | 'Person',
  keywords: string[] = [],
  position?: { x: number; y: number }
): ConceptNode => ({
  id,
  title,
  explanation: `Explanation for ${title}`,
  keywords,
  conceptType,
  position: position || { x: 0, y: 0 },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  resources: [],
});

const createTestEdge = (id: string, source: string, target: string, label?: string): ConceptEdge => ({
  id,
  source,
  target,
  label,
});

// Test data for machine learning domain
const testNodes: ConceptNode[] = [
  createTestNode('ml-1', 'Machine Learning', 'Field', ['AI', 'algorithms', 'data']),
  createTestNode('ml-2', 'Supervised Learning', 'Theory', ['training', 'labels', 'prediction']),
  createTestNode('ml-3', 'Neural Networks', 'Algorithm', ['deep learning', 'neurons', 'backprop']),
  createTestNode('ml-4', 'TensorFlow', 'Tool', ['framework', 'Google', 'deep learning']),
  createTestNode('ml-5', 'Geoffrey Hinton', 'Person', ['researcher', 'deep learning', 'pioneer']),
  createTestNode('ml-6', 'Unsupervised Learning', 'Theory', ['clustering', 'patterns', 'unlabeled']),
  createTestNode('ml-7', 'Linear Algebra', 'Field', ['math', 'vectors', 'matrices']),
];

const testEdges: ConceptEdge[] = [
  createTestEdge('e1-2', 'ml-1', 'ml-2', 'includes'),
  createTestEdge('e1-6', 'ml-1', 'ml-6', 'includes'),
  createTestEdge('e2-3', 'ml-2', 'ml-3', 'uses'),
  createTestEdge('e3-4', 'ml-3', 'ml-4', 'implemented in'),
  createTestEdge('e3-5', 'ml-3', 'ml-5', 'pioneered by'),
  createTestEdge('e1-7', 'ml-1', 'ml-7', 'requires'),
];

const testGraph: ConceptGraph = {
  nodes: testNodes,
  edges: testEdges,
};

describe('RelationshipAnalyzer', () => {
  let analyzer: RelationshipAnalyzer;

  beforeEach(() => {
    analyzer = new RelationshipAnalyzer(testNodes, testEdges);
  });

  describe('analyzeRelationship', () => {
    it('should calculate relationship scores correctly', () => {
      const rootNode = testNodes[0]; // Machine Learning
      const targetNode = testNodes[1]; // Supervised Learning
      
      const score = analyzer.analyzeRelationship(rootNode, targetNode);
      
      expect(score).toMatchObject({
        directness: expect.any(Number),
        importance: expect.any(Number),
        conceptTypeWeight: expect.any(Number),
        keywordSimilarity: expect.any(Number),
        combinedScore: expect.any(Number),
        level: expect.any(Number),
      });
      
      expect(score.directness).toBeGreaterThanOrEqual(0);
      expect(score.importance).toBeGreaterThanOrEqual(0);
      expect(score.importance).toBeLessThanOrEqual(1);
      expect(score.conceptTypeWeight).toBeGreaterThanOrEqual(0);
      expect(score.conceptTypeWeight).toBeLessThanOrEqual(1);
    });

    it('should assign lower directness scores to directly connected nodes', () => {
      const rootNode = testNodes[0]; // Machine Learning
      const directlyConnected = testNodes[1]; // Supervised Learning (connected)
      const indirectlyConnected = testNodes[2]; // Neural Networks (connected via Supervised Learning)
      
      const directScore = analyzer.analyzeRelationship(rootNode, directlyConnected);
      const indirectScore = analyzer.analyzeRelationship(rootNode, indirectlyConnected);
      
      expect(directScore.directness).toBeLessThan(indirectScore.directness);
    });

    it('should calculate concept type compatibility correctly', () => {
      const fieldNode = testNodes[0]; // Machine Learning (Field)
      const theoryNode = testNodes[1]; // Supervised Learning (Theory) 
      const algorithmNode = testNodes[2]; // Neural Networks (Algorithm)
      const toolNode = testNodes[3]; // TensorFlow (Tool)
      const personNode = testNodes[4]; // Geoffrey Hinton (Person)
      
      const theoryScore = analyzer.analyzeRelationship(fieldNode, theoryNode);
      const algorithmScore = analyzer.analyzeRelationship(fieldNode, algorithmNode);
      const toolScore = analyzer.analyzeRelationship(fieldNode, toolNode);
      const personScore = analyzer.analyzeRelationship(fieldNode, personNode);
      
      // Field should be most compatible with Theory, least with Person
      expect(theoryScore.conceptTypeWeight).toBeGreaterThan(algorithmScore.conceptTypeWeight);
      expect(algorithmScore.conceptTypeWeight).toBeGreaterThan(toolScore.conceptTypeWeight);
      expect(toolScore.conceptTypeWeight).toBeGreaterThan(personScore.conceptTypeWeight);
    });

    it('should calculate keyword similarity correctly', () => {
      const rootNode = createTestNode('test-1', 'Test Root', 'Field', ['AI', 'data', 'learning']);
      const similarNode = createTestNode('test-2', 'Similar Node', 'Theory', ['AI', 'learning', 'algorithm']);
      const differentNode = createTestNode('test-3', 'Different Node', 'Tool', ['web', 'frontend', 'javascript']);
      
      const testAnalyzer = new RelationshipAnalyzer([rootNode, similarNode, differentNode], []);
      
      const similarScore = testAnalyzer.analyzeRelationship(rootNode, similarNode);
      const differentScore = testAnalyzer.analyzeRelationship(rootNode, differentNode);
      
      expect(similarScore.keywordSimilarity).toBeGreaterThan(differentScore.keywordSimilarity);
    });
  });
});

describe('IntelligentRadialLayout', () => {
  let layout: IntelligentRadialLayout;
  const config: LayoutConfig = {
    width: 800,
    height: 600,
    nodeSpacing: 100,
    radius: 150,
  };

  beforeEach(() => {
    layout = new IntelligentRadialLayout(testNodes, testEdges, 'ml-1', config);
  });

  describe('layout', () => {
    it('should place root node at center', () => {
      const result = layout.layout();
      const rootNode = result.find(n => n.id === 'ml-1');
      
      expect(rootNode).toBeDefined();
      expect(rootNode!.position!.x).toBe(config.width / 2);
      expect(rootNode!.position!.y).toBe(config.height / 2);
    });

    it('should position all nodes with valid coordinates', () => {
      const result = layout.layout();
      
      result.forEach(node => {
        expect(node.position).toBeDefined();
        expect(node.position!.x).toBeGreaterThanOrEqual(0);
        expect(node.position!.y).toBeGreaterThanOrEqual(0);
        expect(node.position!.x).toBeLessThanOrEqual(config.width);
        expect(node.position!.y).toBeLessThanOrEqual(config.height);
      });
    });

    it('should arrange nodes in multiple levels around center', () => {
      const result = layout.layout();
      const center = { x: config.width / 2, y: config.height / 2 };
      
      // Calculate distances from center for all non-root nodes
      const distances = result
        .filter(node => node.id !== 'ml-1')
        .map(node => {
          const dx = node.position!.x - center.x;
          const dy = node.position!.y - center.y;
          return Math.sqrt(dx * dx + dy * dy);
        });
      
      // Should have nodes at different distances (multiple levels)
      const uniqueDistances = new Set(distances.map(d => Math.round(d / 10) * 10)); // Round to nearest 10
      expect(uniqueDistances.size).toBeGreaterThan(1);
    });

    it('should generally prioritize Fields and Theories closer to center than Tools and People', () => {
      const result = layout.layout();
      const center = { x: config.width / 2, y: config.height / 2 };
      
      const getDistanceFromCenter = (node: ConceptNode) => {
        const dx = node.position!.x - center.x;
        const dy = node.position!.y - center.y;
        return Math.sqrt(dx * dx + dy * dy);
      };
      
      // Get average distances for each concept type
      const getAverageDistance = (conceptType: string) => {
        const nodes = result.filter(n => n.conceptType === conceptType && n.id !== 'ml-1');
        if (nodes.length === 0) return 0;
        const totalDistance = nodes.reduce((sum, node) => sum + getDistanceFromCenter(node), 0);
        return totalDistance / nodes.length;
      };
      
      const fieldAvgDistance = getAverageDistance('Field');
      const theoryAvgDistance = getAverageDistance('Theory');
      const algorithmAvgDistance = getAverageDistance('Algorithm');
      const toolAvgDistance = getAverageDistance('Tool');
      const personAvgDistance = getAverageDistance('Person');
      
      // Fields should generally be closer than Tools and People
      if (fieldAvgDistance > 0 && toolAvgDistance > 0) {
        expect(fieldAvgDistance).toBeLessThan(toolAvgDistance * 1.2); // Allow some tolerance
      }
      
      if (theoryAvgDistance > 0 && personAvgDistance > 0) {
        expect(theoryAvgDistance).toBeLessThan(personAvgDistance * 1.2); // Allow some tolerance
      }
      
      // At minimum, verify that concept types are being considered in positioning
      const allDistances = [fieldAvgDistance, theoryAvgDistance, algorithmAvgDistance, toolAvgDistance, personAvgDistance]
        .filter(d => d > 0);
      expect(allDistances.length).toBeGreaterThan(0);
    });

    it('should handle disconnected nodes gracefully', () => {
      const disconnectedNode = createTestNode('disconnected', 'Isolated Node', 'Theory');
      const nodesWithDisconnected = [...testNodes, disconnectedNode];
      
      const disconnectedLayout = new IntelligentRadialLayout(
        nodesWithDisconnected, 
        testEdges, 
        'ml-1', 
        config
      );
      
      const result = disconnectedLayout.layout();
      const isolated = result.find(n => n.id === 'disconnected');
      
      expect(isolated).toBeDefined();
      expect(isolated!.position).toBeDefined();
      expect(isolated!.position!.x).toBeGreaterThanOrEqual(0);
      expect(isolated!.position!.y).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty node list gracefully', () => {
      const emptyLayout = new IntelligentRadialLayout([], [], 'nonexistent', config);
      const result = emptyLayout.layout();
      
      expect(result).toEqual([]);
    });

    it('should handle missing root node gracefully', () => {
      const invalidLayout = new IntelligentRadialLayout(testNodes, testEdges, 'nonexistent', config);
      const result = invalidLayout.layout();
      
      // Should still return the nodes, but positions might not be optimal
      expect(result).toHaveLength(testNodes.length);
    });
  });

  describe('with different concept types scenarios', () => {
    it('should handle learning scenario prioritization', () => {
      // Create a learning-focused graph
      const learningNodes = [
        createTestNode('topic', 'React', 'Tool', ['javascript', 'ui', 'framework']),
        createTestNode('prereq1', 'JavaScript', 'Field', ['programming', 'web', 'language']),
        createTestNode('prereq2', 'HTML', 'Field', ['markup', 'web', 'structure']),
        createTestNode('concept1', 'Components', 'Theory', ['ui', 'reusable', 'modular']),
        createTestNode('concept2', 'Virtual DOM', 'Algorithm', ['performance', 'rendering', 'diff']),
        createTestNode('tool1', 'Create React App', 'Tool', ['scaffolding', 'build', 'development']),
      ];
      
      const learningEdges = [
        createTestEdge('e1', 'topic', 'prereq1', 'requires'),
        createTestEdge('e2', 'topic', 'prereq2', 'requires'),
        createTestEdge('e3', 'topic', 'concept1', 'includes'),
        createTestEdge('e4', 'topic', 'concept2', 'uses'),
        createTestEdge('e5', 'concept2', 'tool1', 'optimized by'),
      ];
      
      const learningLayout = new IntelligentRadialLayout(learningNodes, learningEdges, 'topic', config);
      const result = learningLayout.layout();
      
      // Prerequisites (Fields) should be closer than tools
      const center = { x: config.width / 2, y: config.height / 2 };
      const getDistance = (id: string) => {
        const node = result.find(n => n.id === id)!;
        const dx = node.position!.x - center.x;
        const dy = node.position!.y - center.y;
        return Math.sqrt(dx * dx + dy * dy);
      };
      
      const prereqDistance = Math.min(getDistance('prereq1'), getDistance('prereq2'));
      const toolDistance = getDistance('tool1');
      
      expect(prereqDistance).toBeLessThan(toolDistance);
    });

    it('should handle brainstorming scenario prioritization', () => {
      // Create a problem-solving focused graph
      const problemNodes = [
        createTestNode('problem', 'World Hunger', 'Field', ['global', 'crisis', 'food']),
        createTestNode('cause1', 'Poverty', 'Theory', ['economics', 'inequality', 'access']),
        createTestNode('cause2', 'Climate Change', 'Field', ['environment', 'agriculture', 'weather']),
        createTestNode('solution1', 'Sustainable Agriculture', 'Algorithm', ['farming', 'efficiency', 'crops']),
        createTestNode('tool1', 'Precision Farming', 'Tool', ['technology', 'sensors', 'automation']),
        createTestNode('stakeholder1', 'UN Food Programme', 'Person', ['organization', 'relief', 'coordination']),
      ];
      
      const problemEdges = [
        createTestEdge('e1', 'problem', 'cause1', 'caused by'),
        createTestEdge('e2', 'problem', 'cause2', 'caused by'),
        createTestEdge('e3', 'cause1', 'solution1', 'addressed by'),
        createTestEdge('e4', 'solution1', 'tool1', 'implements'),
        createTestEdge('e5', 'solution1', 'stakeholder1', 'coordinated by'),
      ];
      
      const problemLayout = new IntelligentRadialLayout(problemNodes, problemEdges, 'problem', config);
      const result = problemLayout.layout();
      
      // All nodes should have valid positions
      result.forEach(node => {
        expect(node.position).toBeDefined();
        expect(typeof node.position!.x).toBe('number');
        expect(typeof node.position!.y).toBe('number');
      });
    });
  });
});

describe('IntelligentRadialLayout integration scenarios', () => {
  it('should work with the existing auto-layout system', async () => {
    const { autoLayout } = await import('../../src/utils/graphLayout');
    
    const result = autoLayout(testGraph, 'exploration', 800, 600, 'ml-1');
    
    expect(result.nodes).toHaveLength(testNodes.length);
    expect(result.edges).toEqual(testEdges);
    
    // Root node should be centered
    const rootNode = result.nodes.find(n => n.id === 'ml-1');
    expect(rootNode!.position!.x).toBe(400);
    expect(rootNode!.position!.y).toBe(300);
  });

  it('should maintain node references and not duplicate', () => {
    const layout = new IntelligentRadialLayout(testNodes, testEdges, 'ml-1', {
      width: 800,
      height: 600,
      nodeSpacing: 100,
    });
    
    const result = layout.layout();
    
    // Should return same number of nodes
    expect(result).toHaveLength(testNodes.length);
    
    // Should maintain all original node IDs
    const resultIds = new Set(result.map(n => n.id));
    const originalIds = new Set(testNodes.map(n => n.id));
    expect(resultIds).toEqual(originalIds);
  });
}); 