import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { ConceptNode, ConceptEdge, ConceptGraph, ConceptType } from '../types';

/**
 * Extended node type for React Flow with concept data
 */
export interface ConceptFlowNode extends Node {
  data: ConceptNode & { label: string };
}

/**
 * Extended edge type for React Flow with concept data
 */
export interface ConceptFlowEdge extends Edge {
  data?: Record<string, unknown>;
}

/**
 * Styling configuration for different concept types
 */
const CONCEPT_TYPE_STYLES: Record<ConceptType, {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  borderWidth: number;
}> = {
  'Field': {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976d2',
    textColor: '#0d47a1',
    borderWidth: 2,
  },
  'Theory': {
    backgroundColor: '#f3e5f5',
    borderColor: '#7b1fa2',
    textColor: '#4a148c',
    borderWidth: 2,
  },
  'Algorithm': {
    backgroundColor: '#e8f5e8',
    borderColor: '#388e3c',
    textColor: '#1b5e20',
    borderWidth: 2,
  },
  'Tool': {
    backgroundColor: '#fff3e0',
    borderColor: '#f57c00',
    textColor: '#e65100',
    borderWidth: 2,
  },
  'Person': {
    backgroundColor: '#fce4ec',
    borderColor: '#c2185b',
    textColor: '#880e4f',
    borderWidth: 2,
  },
};

/**
 * Convert ConceptNode array to React Flow nodes with appropriate styling
 */
export function convertToReactFlowNodes(
  nodes: ConceptNode[],
  selectedNodeId?: string | null
): ConceptFlowNode[] {
  return nodes.map(node => {
    const conceptTypeStyle = node.conceptType ? CONCEPT_TYPE_STYLES[node.conceptType] : CONCEPT_TYPE_STYLES['Theory'];
    const isSelected = selectedNodeId === node.id;

    return {
      id: node.id,
      position: node.position || { x: 0, y: 0 },
      data: { 
        ...node, 
        label: node.title 
      },
      type: 'concept', // Use custom node type
      selected: isSelected,
      style: {
        backgroundColor: conceptTypeStyle.backgroundColor,
        border: `${conceptTypeStyle.borderWidth}px solid ${conceptTypeStyle.borderColor}`,
        borderRadius: '8px',
        padding: '10px',
        minWidth: '120px',
        maxWidth: '200px',
        color: conceptTypeStyle.textColor,
        fontSize: '14px',
        fontWeight: '500',
        opacity: 1.0,
        boxShadow: isSelected ? '0 0 10px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
      },
      className: `concept-node concept-${node.conceptType?.toLowerCase() || 'theory'}${isSelected ? ' selected' : ''}`,
    };
  });
}

/**
 * Convert ConceptEdge array to React Flow edges with appropriate styling
 */
export function convertToReactFlowEdges(
  edges: ConceptEdge[],
  selectedEdgeId?: string | null
): ConceptFlowEdge[] {
  return edges.map(edge => {
    const isSelected = selectedEdgeId === edge.id;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'default',
      animated: false,
      selected: isSelected,
      style: {
        stroke: isSelected ? '#ff6b6b' : '#64748b',
        strokeWidth: 2,
        opacity: 0.8,
      },
      labelStyle: {
        fontSize: '12px',
        fontWeight: '500',
        fill: '#374151',
      },
      labelBgStyle: {
        fill: 'white',
        fillOpacity: 0.8,
      },
      data: {
        ...edge,
        label: edge.label,
        conceptType: 'edge',
        animated: false,
      },
    };
  });
}

/**
 * Convert React Flow node changes back to ConceptNode updates
 */
export function handleNodeChanges(
  changes: NodeChange[],
  currentNodes: ConceptNode[]
): ConceptNode[] {
  let updatedNodes = [...currentNodes];

  changes.forEach(change => {
    switch (change.type) {
      case 'position':
        if (change.position && change.dragging === false) {
          // Only update position when dragging is complete
          updatedNodes = updatedNodes.map(node =>
            node.id === change.id
              ? { ...node, position: change.position!, updatedAt: new Date() }
              : node
          );
        }
        break;
      case 'remove':
        updatedNodes = updatedNodes.filter(node => node.id !== change.id);
        break;
      case 'select':
        // Selection is handled separately in the component
        break;
      default:
        break;
    }
  });

  return updatedNodes;
}

/**
 * Convert React Flow edge changes back to ConceptEdge updates
 */
export function handleEdgeChanges(
  changes: EdgeChange[],
  currentEdges: ConceptEdge[]
): ConceptEdge[] {
  let updatedEdges = [...currentEdges];

  changes.forEach(change => {
    switch (change.type) {
      case 'remove':
        updatedEdges = updatedEdges.filter(edge => edge.id !== change.id);
        break;
      case 'select':
        // Selection is handled separately in the component
        break;
      default:
        break;
    }
  });

  return updatedEdges;
}

/**
 * Handle new connections from React Flow
 */
export function handleConnection(
  connection: Connection,
  currentEdges: ConceptEdge[]
): ConceptEdge | null {
  if (!connection.source || !connection.target) {
    return null;
  }

  // Check if edge already exists
  const existingEdge = currentEdges.find(
    edge => edge.source === connection.source && edge.target === connection.target
  );

  if (existingEdge) {
    return null; // Don't create duplicate edges
  }

  // Create new edge
  const newEdge: ConceptEdge = {
    id: `e${connection.source}-${connection.target}`,
    source: connection.source,
    target: connection.target,
    label: 'relates to',
  };

  return newEdge;
}

/**
 * Synchronize selection state between React Flow and store
 */
export function syncSelectionState(
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
  onNodeSelect: (nodeId: string | null) => void,
  onEdgeSelect: (edgeId: string | null) => void
): void {
  const selectedNodes = nodes.filter(node => node.selected);
  const selectedEdges = edges.filter(edge => edge.selected);

  // Handle node selection
  if (selectedNodes.length === 1) {
    onNodeSelect(selectedNodes[0].id);
  } else if (selectedNodes.length === 0) {
    onNodeSelect(null);
  }

  // Handle edge selection
  if (selectedEdges.length === 1) {
    onEdgeSelect(selectedEdges[0].id);
  } else if (selectedEdges.length === 0) {
    onEdgeSelect(null);
  }
}

/**
 * Export graph data in various formats
 */
export const GraphExporter = {
  /**
   * Export as JSON
   */
  toJSON(graph: ConceptGraph): string {
    return JSON.stringify(graph, null, 2);
  },

  /**
   * Export as CSV (nodes only)
   */
  toCSV(graph: ConceptGraph): string {
    const headers = ['id', 'title', 'explanation', 'keywords', 'conceptType', 'resources'];
    const rows = graph.nodes.map(node => [
      node.id,
      `"${node.title}"`,
      `"${node.explanation}"`,
      `"${node.keywords.join(', ')}"`,
      node.conceptType || '',
      `"${node.resources.join(', ')}"`,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  },

  /**
   * Export as Mermaid diagram
   */
  toMermaid(graph: ConceptGraph): string {
    let mermaid = 'graph TD\n';
    
    // Add nodes with labels
    graph.nodes.forEach(node => {
      mermaid += `  ${node.id}["${node.title}"]\n`;
    });

    // Add edges
    graph.edges.forEach(edge => {
      const label = edge.label ? `|${edge.label}|` : '';
      mermaid += `  ${edge.source} -->${label} ${edge.target}\n`;
    });

    return mermaid;
  },

  /**
   * Export as DOT format (Graphviz)
   */
  toDOT(graph: ConceptGraph): string {
    let dot = 'digraph ConceptGraph {\n';
    dot += '  rankdir=TB;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Add nodes
    graph.nodes.forEach(node => {
      const color = node.conceptType ? CONCEPT_TYPE_STYLES[node.conceptType].borderColor : '#666';
      dot += `  "${node.id}" [label="${node.title}", color="${color}"];\n`;
    });

    dot += '\n';

    // Add edges
    graph.edges.forEach(edge => {
      const label = edge.label ? ` [label="${edge.label}"]` : '';
      dot += `  "${edge.source}" -> "${edge.target}"${label};\n`;
    });

    dot += '}';
    return dot;
  },
};

/**
 * Import graph data from various formats
 */
export const GraphImporter = {
  /**
   * Import from JSON
   */
  fromJSON(jsonString: string): ConceptGraph {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate structure
      if (!parsed.nodes || !parsed.edges || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error('Invalid graph structure');
      }

      // Ensure all nodes have required fields
      const nodes: ConceptNode[] = parsed.nodes.map((node: Partial<ConceptNode>) => ({
        id: node.id || '',
        title: node.title || '',
        explanation: node.explanation || '',
        keywords: Array.isArray(node.keywords) ? node.keywords : [],
        conceptType: node.conceptType,
        position: node.position || { x: 0, y: 0 },
        createdAt: node.createdAt ? new Date(node.createdAt) : new Date(),
        updatedAt: node.updatedAt ? new Date(node.updatedAt) : new Date(),
        resources: Array.isArray(node.resources) ? node.resources : [],
        imageUrl: node.imageUrl,
      }));

      // Ensure all edges have required fields
      const edges: ConceptEdge[] = parsed.edges.map((edge: Partial<ConceptEdge>) => ({
        id: edge.id || '',
        source: edge.source || '',
        target: edge.target || '',
        label: edge.label,
      }));

      return { nodes, edges };
    } catch (error) {
      throw new Error(`Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Import from CSV (nodes only)
   */
  fromCSV(csvString: string): ConceptNode[] {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header and one data row');
    }

    const nodes: ConceptNode[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const node: ConceptNode = {
        id: values[0] || `node-${i}`,
        title: values[1] || '',
        explanation: values[2] || '',
        keywords: values[3] ? values[3].split(',').map(k => k.trim()) : [],
        conceptType: values[4] as ConceptType || undefined,
        position: { x: 0, y: 0 },
        createdAt: new Date(),
        updatedAt: new Date(),
        resources: values[5] ? values[5].split(',').map(r => r.trim()) : [],
      };
      nodes.push(node);
    }

    return nodes;
  },
};

/**
 * Utility functions for React Flow integration
 */
export const ReactFlowUtils = {
  /**
   * Get the bounding box of all nodes
   */
  getGraphBounds(nodes: ConceptNode[]): { 
    minX: number; 
    minY: number; 
    maxX: number; 
    maxY: number; 
    width: number; 
    height: number; 
  } {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    const positions = nodes.map(node => node.position || { x: 0, y: 0 });
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x));
    const maxY = Math.max(...positions.map(p => p.y));

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  },

  /**
   * Calculate optimal viewport for fitView
   */
  calculateViewport(
    nodes: ConceptNode[],
    canvasWidth: number,
    canvasHeight: number,
    padding = 50
  ): { x: number; y: number; zoom: number } {
    const bounds = this.getGraphBounds(nodes);
    
    if (bounds.width === 0 && bounds.height === 0) {
      return { x: 0, y: 0, zoom: 1 };
    }

    const scaleX = (canvasWidth - padding * 2) / bounds.width;
    const scaleY = (canvasHeight - padding * 2) / bounds.height;
    const zoom = Math.min(scaleX, scaleY, 2); // Max zoom of 2

    const x = (canvasWidth - bounds.width * zoom) / 2 - bounds.minX * zoom;
    const y = (canvasHeight - bounds.height * zoom) / 2 - bounds.minY * zoom;

    return { x, y, zoom };
  },

  /**
   * Generate unique node ID
   */
  generateNodeId(existingNodes: ConceptNode[]): string {
    const existingIds = new Set(existingNodes.map(node => node.id));
    let counter = 1;
    
    while (existingIds.has(`node-${counter}`)) {
      counter++;
    }
    
    return `node-${counter}`;
  },

  /**
   * Generate unique edge ID
   */
  generateEdgeId(source: string, target: string, existingEdges: ConceptEdge[]): string {
    const baseId = `e${source}-${target}`;
    const existingIds = new Set(existingEdges.map(edge => edge.id));
    
    if (!existingIds.has(baseId)) {
      return baseId;
    }
    
    let counter = 1;
    while (existingIds.has(`${baseId}-${counter}`)) {
      counter++;
    }
    
    return `${baseId}-${counter}`;
  },
}; 