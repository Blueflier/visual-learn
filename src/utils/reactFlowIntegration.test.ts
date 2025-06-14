import { describe, it, expect, beforeEach } from 'vitest';
import type { NodeChange, EdgeChange, Connection } from '@xyflow/react';
import {
  convertToReactFlowNodes,
  convertToReactFlowEdges,
  handleNodeChanges,
  handleEdgeChanges,
  handleConnection,
  GraphExporter,
  GraphImporter,
  ReactFlowUtils,
} from './reactFlowIntegration';
import type { ConceptNode, ConceptEdge, ConceptGraph, ConceptType, ConceptDifficulty } from '../types';

// Test data
const createTestNode = (
  id: string,
  title: string,
  conceptType?: ConceptType,
  difficulty?: ConceptDifficulty,
  position?: { x: number; y: number }
): ConceptNode => ({
  id,
  title,
  explanation: `Explanation for ${title}`,
  keywords: ['test', 'keyword'],
  conceptType,
  difficulty,
  position: position || { x: 0, y: 0 },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  resources: ['https://example.com'],
});

const createTestEdge = (id: string, source: string, target: string, label?: string): ConceptEdge => ({
  id,
  source,
  target,
  label,
});

describe('ReactFlow Integration', () => {
  let testNodes: ConceptNode[];
  let testEdges: ConceptEdge[];
  let testGraph: ConceptGraph;

  beforeEach(() => {
    testNodes = [
      createTestNode('1', 'React', 'Tool', 'Beginner', { x: 100, y: 100 }),
      createTestNode('2', 'Components', 'Theory', 'Intermediate', { x: 200, y: 200 }),
      createTestNode('3', 'State Management', 'Algorithm', 'Advanced', { x: 300, y: 300 }),
    ];

    testEdges = [
      createTestEdge('e1-2', '1', '2', 'has'),
      createTestEdge('e2-3', '2', '3', 'uses'),
    ];

    testGraph = {
      nodes: testNodes,
      edges: testEdges,
    };
  });

  describe('convertToReactFlowNodes', () => {
    it('should convert ConceptNodes to React Flow nodes with proper styling', () => {
      const result = convertToReactFlowNodes(testNodes);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: '1',
        position: { x: 100, y: 100 },
        type: 'concept',
        data: expect.objectContaining({
          title: 'React',
          label: 'React',
          conceptType: 'Tool',
          difficulty: 'Beginner',
        }),
      });

      // Check styling is applied
      expect(result[0].style).toBeDefined();
      expect(result[0].className).toContain('concept-node');
      expect(result[0].className).toContain('concept-tool');
      expect(result[0].className).toContain('difficulty-beginner');
    });

    it('should handle selected node styling', () => {
      const result = convertToReactFlowNodes(testNodes, '1');

      expect(result[0].selected).toBe(true);
      expect(result[0].className).toContain('selected');
      expect(result[0].style?.boxShadow).toContain('rgba(0,0,0,0.3)');

      expect(result[1].selected).toBe(false);
      expect(result[1].className).not.toContain('selected');
    });

    it('should handle nodes without optional properties', () => {
      const nodeWithoutOptionals = createTestNode('4', 'Test Node');
      const result = convertToReactFlowNodes([nodeWithoutOptionals]);

      expect(result[0]).toMatchObject({
        id: '4',
        position: { x: 0, y: 0 },
        type: 'concept',
        data: expect.objectContaining({
          title: 'Test Node',
          label: 'Test Node',
        }),
      });
    });
  });

  describe('convertToReactFlowEdges', () => {
    it('should convert ConceptEdges to React Flow edges with proper styling', () => {
      const result = convertToReactFlowEdges(testEdges);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'e1-2',
        source: '1',
        target: '2',
        label: 'has',
        type: 'smoothstep',
        animated: false,
      });

      // Check styling is applied
      expect(result[0].style).toBeDefined();
      expect(result[0].labelStyle).toBeDefined();
    });

    it('should handle selected edge styling', () => {
      const result = convertToReactFlowEdges(testEdges, 'e1-2');

      expect(result[0].selected).toBe(true);
      expect(result[0].style?.stroke).toBe('#ff6b6b');
      expect(result[0].style?.strokeWidth).toBe(3);

      expect(result[1].selected).toBe(false);
      expect(result[1].style?.stroke).toBe('#64748b');
      expect(result[1].style?.strokeWidth).toBe(2);
    });
  });

  describe('handleNodeChanges', () => {
    it('should handle position changes', () => {
      const changes: NodeChange[] = [
        {
          id: '1',
          type: 'position',
          position: { x: 150, y: 150 },
          dragging: false,
        },
      ];

      const result = handleNodeChanges(changes, testNodes);

      expect(result[0].position).toEqual({ x: 150, y: 150 });
      expect(result[0].updatedAt).toBeInstanceOf(Date);
      expect(result[1]).toBe(testNodes[1]); // Other nodes unchanged
    });

    it('should ignore position changes while dragging', () => {
      const changes: NodeChange[] = [
        {
          id: '1',
          type: 'position',
          position: { x: 150, y: 150 },
          dragging: true,
        },
      ];

      const result = handleNodeChanges(changes, testNodes);

      expect(result[0].position).toEqual({ x: 100, y: 100 }); // Unchanged
    });

    it('should handle node removal', () => {
      const changes: NodeChange[] = [
        {
          id: '1',
          type: 'remove',
        },
      ];

      const result = handleNodeChanges(changes, testNodes);

      expect(result).toHaveLength(2);
      expect(result.find(n => n.id === '1')).toBeUndefined();
    });
  });

  describe('handleEdgeChanges', () => {
    it('should handle edge removal', () => {
      const changes: EdgeChange[] = [
        {
          id: 'e1-2',
          type: 'remove',
        },
      ];

      const result = handleEdgeChanges(changes, testEdges);

      expect(result).toHaveLength(1);
      expect(result.find(e => e.id === 'e1-2')).toBeUndefined();
    });
  });

  describe('handleConnection', () => {
    it('should create new edge from connection', () => {
      const connection: Connection = {
        source: '1',
        target: '3',
        sourceHandle: null,
        targetHandle: null,
      };

      const result = handleConnection(connection, testEdges);

      expect(result).toMatchObject({
        id: 'e1-3',
        source: '1',
        target: '3',
        label: 'relates to',
      });
    });

    it('should not create duplicate edges', () => {
      const connection: Connection = {
        source: '1',
        target: '2',
        sourceHandle: null,
        targetHandle: null,
      };

      const result = handleConnection(connection, testEdges);

      expect(result).toBeNull();
    });

    it('should handle invalid connections', () => {
      const connection: Partial<Connection> = {
        source: undefined,
        target: '2',
        sourceHandle: null,
        targetHandle: null,
      };

      const result = handleConnection(connection as Connection, testEdges);

      expect(result).toBeNull();
    });
  });

  describe('GraphExporter', () => {
    it('should export to JSON', () => {
      const result = GraphExporter.toJSON(testGraph);
      const parsed = JSON.parse(result);

      expect(parsed.nodes).toHaveLength(3);
      expect(parsed.edges).toHaveLength(2);
      expect(parsed.nodes[0].title).toBe('React');
    });

    it('should export to CSV', () => {
      const result = GraphExporter.toCSV(testGraph);
      const lines = result.split('\n');

      expect(lines[0]).toContain('id,title,explanation');
      expect(lines[1]).toContain('1,"React"');
      expect(lines).toHaveLength(4); // Header + 3 nodes
    });

    it('should export to Mermaid', () => {
      const result = GraphExporter.toMermaid(testGraph);

      expect(result).toContain('graph TD');
      expect(result).toContain('1["React"]');
      expect(result).toContain('1 -->|has| 2');
    });

    it('should export to DOT format', () => {
      const result = GraphExporter.toDOT(testGraph);

      expect(result).toContain('digraph ConceptGraph');
      expect(result).toContain('"1" [label="React"');
      expect(result).toContain('"1" -> "2" [label="has"]');
    });
  });

  describe('GraphImporter', () => {
    it('should import from JSON', () => {
      const jsonString = JSON.stringify(testGraph);
      const result = GraphImporter.fromJSON(jsonString);

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
      expect(result.nodes[0].title).toBe('React');
    });

    it('should handle invalid JSON', () => {
      expect(() => {
        GraphImporter.fromJSON('invalid json');
      }).toThrow('Failed to import JSON');
    });

    it('should handle malformed graph structure', () => {
      expect(() => {
        GraphImporter.fromJSON('{"invalid": "structure"}');
      }).toThrow('Invalid graph structure');
    });

    it('should import from CSV', () => {
      const csvString = 'id,title,explanation,keywords,conceptType,difficulty,resources\n1,React,A library,js,Tool,Beginner,https://react.dev';
      const result = GraphImporter.fromCSV(csvString);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        title: 'React',
        explanation: 'A library',
        keywords: ['js'],
        conceptType: 'Tool',
        difficulty: 'Beginner',
        resources: ['https://react.dev'],
      });
    });

    it('should handle empty CSV', () => {
      expect(() => {
        GraphImporter.fromCSV('header only');
      }).toThrow('CSV must have at least a header and one data row');
    });
  });

  describe('ReactFlowUtils', () => {
    it('should calculate graph bounds', () => {
      const bounds = ReactFlowUtils.getGraphBounds(testNodes);

      expect(bounds).toEqual({
        minX: 100,
        minY: 100,
        maxX: 300,
        maxY: 300,
        width: 200,
        height: 200,
      });
    });

    it('should handle empty nodes for bounds', () => {
      const bounds = ReactFlowUtils.getGraphBounds([]);

      expect(bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        width: 0,
        height: 0,
      });
    });

    it('should calculate viewport', () => {
      const viewport = ReactFlowUtils.calculateViewport(testNodes, 800, 600, 50);

      expect(viewport).toMatchObject({
        x: expect.any(Number),
        y: expect.any(Number),
        zoom: expect.any(Number),
      });
      expect(viewport.zoom).toBeGreaterThan(0);
      expect(viewport.zoom).toBeLessThanOrEqual(2);
    });

    it('should generate unique node ID', () => {
      const id = ReactFlowUtils.generateNodeId(testNodes);

      expect(id).toBe('node-1');
      expect(testNodes.find(n => n.id === id)).toBeUndefined();
    });

    it('should generate unique edge ID', () => {
      const id = ReactFlowUtils.generateEdgeId('1', '3', testEdges);

      expect(id).toBe('e1-3');
      expect(testEdges.find(e => e.id === id)).toBeUndefined();
    });

    it('should handle existing edge ID conflicts', () => {
      const id = ReactFlowUtils.generateEdgeId('1', '2', testEdges);

      expect(id).toBe('e1-2-1');
      expect(testEdges.find(e => e.id === id)).toBeUndefined();
    });
  });
}); 