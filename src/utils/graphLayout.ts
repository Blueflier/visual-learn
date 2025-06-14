import type { ConceptNode, ConceptEdge, ConceptGraph } from '../types';

/**
 * Configuration options for layout algorithms
 */
export interface LayoutConfig {
  /** Width of the layout area */
  width: number;
  /** Height of the layout area */
  height: number;
  /** Minimum distance between nodes */
  nodeSpacing: number;
  /** Number of iterations for force-directed algorithm */
  iterations?: number;
  /** Strength of forces in force-directed layout */
  forceStrength?: number;
  /** Radius for radial layout */
  radius?: number;
}

/**
 * Represents a 2D vector for force calculations
 */
interface Vector2D {
  x: number;
  y: number;
}

/**
 * Default layout configuration
 */
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  width: 800,
  height: 600,
  nodeSpacing: 100,
  iterations: 50,
  forceStrength: 0.1,
  radius: 200,
};

/**
 * Force-directed layout algorithm implementation
 * Uses a simplified version of the Fruchterman-Reingold algorithm
 */
export class ForceDirectedLayout {
  private config: LayoutConfig;
  private nodes: ConceptNode[];
  private edges: ConceptEdge[];
  private forces: Map<string, Vector2D> = new Map();

  constructor(nodes: ConceptNode[], edges: ConceptEdge[], config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    this.nodes = [...nodes];
    this.edges = edges;
    this.initializePositions();
  }

  /**
   * Initialize random positions for nodes that don't have positions
   */
  private initializePositions(): void {
    this.nodes.forEach(node => {
      if (!node.position) {
        node.position = {
          x: Math.random() * this.config.width,
          y: Math.random() * this.config.height,
        };
      }
    });
  }

  /**
   * Calculate repulsive forces between all node pairs
   */
  private calculateRepulsiveForces(): void {
    this.forces.clear();
    
    // Initialize forces for all nodes
    this.nodes.forEach(node => {
      this.forces.set(node.id, { x: 0, y: 0 });
    });
    
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];
        
        const dx = nodeA.position!.x - nodeB.position!.x;
        const dy = nodeA.position!.y - nodeB.position!.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Repulsive force inversely proportional to distance squared
        const force = (this.config.nodeSpacing * this.config.nodeSpacing) / distance;
        const fx = (dx / distance) * force * this.config.forceStrength!;
        const fy = (dy / distance) * force * this.config.forceStrength!;
        
        // Apply forces to both nodes
        const forceA = this.forces.get(nodeA.id)!;
        const forceB = this.forces.get(nodeB.id)!;
        
        forceA.x += fx;
        forceA.y += fy;
        forceB.x -= fx;
        forceB.y -= fy;
      }
    }
  }

  /**
   * Calculate attractive forces along edges
   */
  private calculateAttractiveForces(): void {
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.find(n => n.id === edge.source);
      const targetNode = this.nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      const dx = targetNode.position!.x - sourceNode.position!.x;
      const dy = targetNode.position!.y - sourceNode.position!.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // Attractive force proportional to distance
      const force = distance * this.config.forceStrength! * 0.5;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      
      // Apply forces
      const sourceForce = this.forces.get(sourceNode.id)!;
      const targetForce = this.forces.get(targetNode.id)!;
      
      sourceForce.x += fx;
      sourceForce.y += fy;
      targetForce.x -= fx;
      targetForce.y -= fy;
    });
  }

  /**
   * Apply calculated forces to node positions
   */
  private applyForces(): void {
    this.nodes.forEach(node => {
      const force = this.forces.get(node.id);
      if (!force) return;
      
      // Limit force magnitude to prevent instability
      const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
      const maxForce = 10;
      
      if (magnitude > maxForce) {
        force.x = (force.x / magnitude) * maxForce;
        force.y = (force.y / magnitude) * maxForce;
      }
      
      // Update position
      node.position!.x += force.x;
      node.position!.y += force.y;
      
      // Keep nodes within bounds
      node.position!.x = Math.max(50, Math.min(this.config.width - 50, node.position!.x));
      node.position!.y = Math.max(50, Math.min(this.config.height - 50, node.position!.y));
    });
  }

  /**
   * Run the force-directed layout algorithm
   */
  public layout(): ConceptNode[] {
    for (let i = 0; i < this.config.iterations!; i++) {
      this.calculateRepulsiveForces();
      this.calculateAttractiveForces();
      this.applyForces();
    }
    
    return this.nodes;
  }
}

/**
 * Radial layout algorithm - arranges nodes in concentric circles around a root
 */
export class RadialLayout {
  private config: LayoutConfig;
  private nodes: ConceptNode[];
  private edges: ConceptEdge[];
  private rootNodeId: string;

  constructor(
    nodes: ConceptNode[], 
    edges: ConceptEdge[], 
    rootNodeId: string,
    config: Partial<LayoutConfig> = {}
  ) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    this.nodes = [...nodes];
    this.edges = edges;
    this.rootNodeId = rootNodeId;
  }

  /**
   * Calculate the distance from root for each node using BFS
   */
  private calculateDistances(): Map<string, number> {
    const distances = new Map<string, number>();
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; distance: number }> = [];
    
    // Start with root node
    queue.push({ nodeId: this.rootNodeId, distance: 0 });
    distances.set(this.rootNodeId, 0);
    visited.add(this.rootNodeId);
    
    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!;
      
      // Find connected nodes
      this.edges.forEach(edge => {
        let connectedNodeId: string | null = null;
        
        if (edge.source === nodeId && !visited.has(edge.target)) {
          connectedNodeId = edge.target;
        } else if (edge.target === nodeId && !visited.has(edge.source)) {
          connectedNodeId = edge.source;
        }
        
        if (connectedNodeId) {
          visited.add(connectedNodeId);
          distances.set(connectedNodeId, distance + 1);
          queue.push({ nodeId: connectedNodeId, distance: distance + 1 });
        }
      });
    }
    
    // Handle disconnected nodes
    this.nodes.forEach(node => {
      if (!distances.has(node.id)) {
        distances.set(node.id, 999); // Place disconnected nodes far away
      }
    });
    
    return distances;
  }

  /**
   * Run the radial layout algorithm
   */
  public layout(): ConceptNode[] {
    const distances = this.calculateDistances();
    const center = { x: this.config.width / 2, y: this.config.height / 2 };
    
    // Group nodes by distance
    const nodesByDistance = new Map<number, string[]>();
    distances.forEach((distance, nodeId) => {
      if (!nodesByDistance.has(distance)) {
        nodesByDistance.set(distance, []);
      }
      nodesByDistance.get(distance)!.push(nodeId);
    });
    
    // Position nodes in concentric circles
    nodesByDistance.forEach((nodeIds, distance) => {
      const radius = distance * this.config.radius! * 0.8;
      const angleStep = (2 * Math.PI) / nodeIds.length;
      
      nodeIds.forEach((nodeId, index) => {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        if (distance === 0) {
          // Root node at center
          node.position = { ...center };
        } else {
          // Other nodes in circles
          const angle = index * angleStep;
          node.position = {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
          };
        }
      });
    });
    
    return this.nodes;
  }
}

/**
 * Utility functions for graph layout and positioning
 */
export class GraphLayoutUtils {
  /**
   * Check if two nodes overlap and return the overlap distance
   */
  static getNodeOverlap(nodeA: ConceptNode, nodeB: ConceptNode, nodeRadius = 30): number {
    if (!nodeA.position || !nodeB.position) return 0;
    
    const dx = nodeA.position.x - nodeB.position.x;
    const dy = nodeA.position.y - nodeB.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = nodeRadius * 2;
    
    return Math.max(0, minDistance - distance);
  }

  /**
   * Resolve overlapping nodes by moving them apart
   */
  static resolveOverlaps(nodes: ConceptNode[], nodeRadius = 30): ConceptNode[] {
    const resolvedNodes = [...nodes];
    const maxIterations = 10;
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let hasOverlaps = false;
      
      for (let i = 0; i < resolvedNodes.length; i++) {
        for (let j = i + 1; j < resolvedNodes.length; j++) {
          const nodeA = resolvedNodes[i];
          const nodeB = resolvedNodes[j];
          const overlap = this.getNodeOverlap(nodeA, nodeB, nodeRadius);
          
          if (overlap > 0) {
            hasOverlaps = true;
            
            // Calculate separation vector
            const dx = nodeA.position!.x - nodeB.position!.x;
            const dy = nodeA.position!.y - nodeB.position!.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Move nodes apart
            const separationX = (dx / distance) * (overlap / 2);
            const separationY = (dy / distance) * (overlap / 2);
            
            nodeA.position!.x += separationX;
            nodeA.position!.y += separationY;
            nodeB.position!.x -= separationX;
            nodeB.position!.y -= separationY;
          }
        }
      }
      
      if (!hasOverlaps) break;
    }
    
    return resolvedNodes;
  }

  /**
   * Calculate optimal spacing between nodes based on graph density
   */
  static calculateOptimalSpacing(nodeCount: number, canvasWidth: number, canvasHeight: number): number {
    const area = canvasWidth * canvasHeight;
    const areaPerNode = area / nodeCount;
    const optimalSpacing = Math.sqrt(areaPerNode) * 0.8;
    
    // Clamp between reasonable bounds
    return Math.max(60, Math.min(200, optimalSpacing));
  }

  /**
   * Save current node positions to localStorage
   */
  static savePositions(graphId: string, nodes: ConceptNode[]): void {
    const positions = nodes.reduce((acc, node) => {
      if (node.position) {
        acc[node.id] = node.position;
      }
      return acc;
    }, {} as Record<string, { x: number; y: number }>);
    
    localStorage.setItem(`graph-positions-${graphId}`, JSON.stringify(positions));
  }

  /**
   * Restore node positions from localStorage
   */
  static restorePositions(graphId: string, nodes: ConceptNode[]): ConceptNode[] {
    const savedPositions = localStorage.getItem(`graph-positions-${graphId}`);
    if (!savedPositions) return nodes;
    
    try {
      const positions = JSON.parse(savedPositions) as Record<string, { x: number; y: number }>;
      
      return nodes.map(node => ({
        ...node,
        position: positions[node.id] || node.position,
      }));
    } catch (error) {
      console.warn('Failed to restore positions:', error);
      return nodes;
    }
  }

  /**
   * Calculate optimal initial view (zoom and pan) for the graph
   */
  static calculateOptimalView(
    nodes: ConceptNode[], 
    canvasWidth: number, 
    canvasHeight: number
  ): { zoom: number; pan: { x: number; y: number } } {
    if (nodes.length === 0) {
      return { zoom: 1, pan: { x: 0, y: 0 } };
    }

    // Calculate bounding box of all nodes
    const positions = nodes.filter(n => n.position).map(n => n.position!);
    if (positions.length === 0) {
      return { zoom: 1, pan: { x: 0, y: 0 } };
    }

    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y));

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    // Calculate zoom to fit graph with padding
    const padding = 100;
    const zoomX = (canvasWidth - padding * 2) / (graphWidth || 1);
    const zoomY = (canvasHeight - padding * 2) / (graphHeight || 1);
    const zoom = Math.min(zoomX, zoomY, 2); // Cap at 2x zoom

    // Calculate pan to center the graph
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const pan = {
      x: canvasCenterX - graphCenterX * zoom,
      y: canvasCenterY - graphCenterY * zoom,
    };

    return { zoom: Math.max(0.1, zoom), pan };
  }

  /**
   * Apply a layout algorithm to a graph
   */
  static applyLayout(
    graph: ConceptGraph,
    layoutType: 'force-directed' | 'radial',
    config: Partial<LayoutConfig> = {},
    rootNodeId?: string
  ): ConceptGraph {
    let layoutEngine: ForceDirectedLayout | RadialLayout;
    
    if (layoutType === 'radial') {
      if (!rootNodeId && graph.nodes.length > 0) {
        rootNodeId = graph.nodes[0].id; // Default to first node
      }
      if (!rootNodeId) {
        throw new Error('Root node ID is required for radial layout');
      }
      layoutEngine = new RadialLayout(graph.nodes, graph.edges, rootNodeId, config);
    } else {
      layoutEngine = new ForceDirectedLayout(graph.nodes, graph.edges, config);
    }
    
    const layoutedNodes = layoutEngine.layout();
    const resolvedNodes = this.resolveOverlaps(layoutedNodes);
    
    return {
      ...graph,
      nodes: resolvedNodes,
    };
  }

  /**
   * Create a linear layout for focus mode
   */
  static createLinearLayout(
    nodes: ConceptNode[],
    canvasWidth: number,
    canvasHeight: number,
    spacing = 150
  ): ConceptNode[] {
    const centerY = canvasHeight / 2;
    const totalWidth = (nodes.length - 1) * spacing;
    const startX = (canvasWidth - totalWidth) / 2;
    
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: startX + index * spacing,
        y: centerY,
      },
    }));
  }

  /**
   * Animate position changes smoothly
   */
  static animateToPositions(
    currentNodes: ConceptNode[],
    targetNodes: ConceptNode[],
    duration = 1000,
    onUpdate: (nodes: ConceptNode[]) => void
  ): void {
    const startTime = Date.now();
    const startPositions = new Map(
      currentNodes.map(node => [
        node.id, 
        node.position || { x: 0, y: 0 }
      ])
    );
    const targetPositions = new Map(
      targetNodes.map(node => [
        node.id, 
        node.position || { x: 0, y: 0 }
      ])
    );

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const interpolatedNodes = currentNodes.map(node => {
        const start = startPositions.get(node.id) || { x: 0, y: 0 };
        const target = targetPositions.get(node.id) || start;
        
        return {
          ...node,
          position: {
            x: start.x + (target.x - start.x) * easeOut,
            y: start.y + (target.y - start.y) * easeOut,
          },
        };
      });
      
      onUpdate(interpolatedNodes);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
}

/**
 * High-level layout functions for common use cases
 */

/**
 * Apply force-directed layout to a graph
 */
export function applyForceDirectedLayout(
  graph: ConceptGraph,
  config: Partial<LayoutConfig> = {}
): ConceptGraph {
  return GraphLayoutUtils.applyLayout(graph, 'force-directed', config);
}

/**
 * Apply radial layout to a graph
 */
export function applyRadialLayout(
  graph: ConceptGraph,
  rootNodeId: string,
  config: Partial<LayoutConfig> = {}
): ConceptGraph {
  return GraphLayoutUtils.applyLayout(graph, 'radial', config, rootNodeId);
}

/**
 * Apply linear layout for focus mode
 */
export function applyLinearLayout(
  nodes: ConceptNode[],
  canvasWidth: number,
  canvasHeight: number,
  spacing = 150
): ConceptNode[] {
  return GraphLayoutUtils.createLinearLayout(nodes, canvasWidth, canvasHeight, spacing);
}

/**
 * Auto-layout a graph based on its mode and structure
 */
export function autoLayout(
  graph: ConceptGraph,
  mode: 'focus' | 'exploration',
  canvasWidth: number,
  canvasHeight: number,
  rootNodeId?: string
): ConceptGraph {
  const config: LayoutConfig = {
    width: canvasWidth,
    height: canvasHeight,
    nodeSpacing: GraphLayoutUtils.calculateOptimalSpacing(
      graph.nodes.length,
      canvasWidth,
      canvasHeight
    ),
  };

  if (mode === 'focus') {
    // Linear layout for focus mode
    const linearNodes = GraphLayoutUtils.createLinearLayout(
      graph.nodes,
      canvasWidth,
      canvasHeight
    );
    return { ...graph, nodes: linearNodes };
  } else {
    // Radial or force-directed for exploration mode
    if (rootNodeId && graph.nodes.some(n => n.id === rootNodeId)) {
      return GraphLayoutUtils.applyLayout(graph, 'radial', config, rootNodeId);
    } else {
      return GraphLayoutUtils.applyLayout(graph, 'force-directed', config);
    }
  }
} 