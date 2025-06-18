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
 * Enhanced Radial layout algorithm with intelligent relationship prioritization
 * Arranges nodes in concentric circles based on relationship strength and concept types
 */
export class IntelligentRadialLayout {
  private config: LayoutConfig;
  private nodes: ConceptNode[];
  private rootNodeId: string;
  private relationshipAnalyzer: RelationshipAnalyzer;

  constructor(
    nodes: ConceptNode[], 
    edges: ConceptEdge[], 
    rootNodeId: string,
    config: Partial<LayoutConfig> = {}
  ) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    this.nodes = [...nodes];
    this.rootNodeId = rootNodeId;
    this.relationshipAnalyzer = new RelationshipAnalyzer(nodes, edges);
  }

  /**
   * Calculate relationship scores for all nodes relative to the root
   */
  private calculateRelationshipScores(): Map<string, RelationshipScore> {
    const scores = new Map<string, RelationshipScore>();
    const rootNode = this.nodes.find(n => n.id === this.rootNodeId);
    
    if (!rootNode) {
      console.warn(`Root node ${this.rootNodeId} not found`);
      return scores;
    }

    // Initialize scores for all nodes
    this.nodes.forEach(node => {
      if (node.id === this.rootNodeId) {
        scores.set(node.id, {
          directness: 0, // Root is at center
          importance: 1.0,
          conceptTypeWeight: this.getConceptTypeWeight(node.conceptType),
          keywordSimilarity: 1.0,
          combinedScore: 1.0,
          level: 0
        });
      } else {
        const relationshipScore = this.relationshipAnalyzer.analyzeRelationship(rootNode, node);
        scores.set(node.id, relationshipScore);
      }
    });

    return scores;
  }

  /**
   * Get weight for concept types (higher = more central)
   */
  private getConceptTypeWeight(conceptType?: string): number {
    const weights: Record<string, number> = {
      'Field': 1.0,     // Fundamental fields stay close to center
      'Theory': 0.8,    // Core theories in inner rings  
      'Algorithm': 0.6, // Algorithms in middle rings
      'Tool': 0.4,      // Tools in outer rings
      'Person': 0.3     // People in outermost rings
    };
    return weights[conceptType || 'Theory'] || 0.5;
  }

  /**
   * Group nodes into concentric levels based on relationship scores
   */
  private groupNodesByLevel(scores: Map<string, RelationshipScore>): Map<number, string[]> {
    const levelGroups = new Map<number, string[]>();
    const sortedNodes = Array.from(scores.entries())
      .sort(([, a], [, b]) => a.combinedScore - b.combinedScore); // Lower score = closer to center

    // Root node at center (level 0)
    levelGroups.set(0, [this.rootNodeId]);

    // Group remaining nodes into levels
    const remainingNodes = sortedNodes.filter(([id]) => id !== this.rootNodeId);
    const maxLevels = Math.min(5, Math.ceil(Math.sqrt(remainingNodes.length)) + 1);
    const nodesPerLevel = Math.ceil(remainingNodes.length / (maxLevels - 1));

    for (let level = 1; level < maxLevels; level++) {
      const startIndex = (level - 1) * nodesPerLevel;
      const endIndex = Math.min(startIndex + nodesPerLevel, remainingNodes.length);
      const levelNodes = remainingNodes.slice(startIndex, endIndex).map(([id]) => id);
      
      if (levelNodes.length > 0) {
        levelGroups.set(level, levelNodes);
      }
    }

    return levelGroups;
  }

  /**
   * Position nodes in their assigned levels with optimal spacing
   */
  private positionNodesInLevels(
    levelGroups: Map<number, string[]>, 
    scores: Map<string, RelationshipScore>
  ): void {
    const center = { x: this.config.width / 2, y: this.config.height / 2 };
    const maxRadius = Math.min(this.config.width, this.config.height) * 0.4; // Maximum 40% of canvas
    const baseRadius = Math.min(this.config.width, this.config.height) * 0.15;
    const maxLevels = Math.max(1, levelGroups.size - 1); // Exclude level 0

    levelGroups.forEach((nodeIds, level) => {
      if (level === 0) {
        // Root node at center
        const rootNode = this.nodes.find(n => n.id === this.rootNodeId);
        if (rootNode) {
          rootNode.position = { ...center };
        }
        return;
      }

      // Calculate radius for this level with bounds checking
      const radiusMultiplier = level / maxLevels; // Normalize to 0-1
      const radius = Math.min(baseRadius + (maxRadius - baseRadius) * radiusMultiplier, maxRadius);
      const angleStep = (2 * Math.PI) / nodeIds.length;
      
      // Sort nodes within level by importance for better visual arrangement
      const sortedNodeIds = nodeIds.sort((a, b) => {
        const scoreA = scores.get(a)?.importance || 0;
        const scoreB = scores.get(b)?.importance || 0;
        return scoreB - scoreA; // Higher importance first
      });

      sortedNodeIds.forEach((nodeId, index) => {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Add some offset to create more natural, less rigid positioning
        const angleOffset = (level % 2) * (angleStep / 2); // Alternate levels offset
        const angle = index * angleStep + angleOffset;
        
        // Add small random variation for more organic look (but smaller to stay in bounds)
        const radiusVariation = (Math.random() - 0.5) * radius * 0.05; // Reduced from 0.1 to 0.05
        const finalRadius = Math.max(0, Math.min(radius + radiusVariation, maxRadius));

        const x = center.x + finalRadius * Math.cos(angle);
        const y = center.y + finalRadius * Math.sin(angle);

        // Ensure coordinates are within canvas bounds with padding
        const padding = 50;
        node.position = {
          x: Math.max(padding, Math.min(this.config.width - padding, x)),
          y: Math.max(padding, Math.min(this.config.height - padding, y)),
        };
      });
    });
  }

  /**
   * Run the intelligent radial layout algorithm
   */
  public layout(): ConceptNode[] {
    if (this.nodes.length === 0) return [];

    const scores = this.calculateRelationshipScores();
    const levelGroups = this.groupNodesByLevel(scores);
    this.positionNodesInLevels(levelGroups, scores);

    return this.nodes;
  }
}

/**
 * Relationship analysis utilities for intelligent layout
 */
export class RelationshipAnalyzer {
  private nodes: Map<string, ConceptNode>;
  private edges: ConceptEdge[];
  private adjacencyList: Map<string, string[]>;

  constructor(nodes: ConceptNode[], edges: ConceptEdge[]) {
    this.nodes = new Map(nodes.map(n => [n.id, n]));
    this.edges = edges;
    this.adjacencyList = this.buildAdjacencyList();
  }

  private buildAdjacencyList(): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();
    
    // Initialize
    this.nodes.forEach((_, nodeId) => {
      adjacencyList.set(nodeId, []);
    });

    // Build connections
    this.edges.forEach(edge => {
      const sourceConnections = adjacencyList.get(edge.source) || [];
      const targetConnections = adjacencyList.get(edge.target) || [];
      
      sourceConnections.push(edge.target);
      targetConnections.push(edge.source);
      
      adjacencyList.set(edge.source, sourceConnections);
      adjacencyList.set(edge.target, targetConnections);
    });

    return adjacencyList;
  }

  /**
   * Analyze relationship between two nodes
   */
  public analyzeRelationship(rootNode: ConceptNode, targetNode: ConceptNode): RelationshipScore {
    // Calculate directness (shortest path length)
    const directness = this.calculateShortestPath(rootNode.id, targetNode.id);
    
    // Calculate concept type compatibility
    const conceptTypeWeight = this.calculateConceptTypeCompatibility(rootNode, targetNode);
    
    // Calculate keyword similarity
    const keywordSimilarity = this.calculateKeywordSimilarity(rootNode, targetNode);
    
    // Calculate edge relationship strength
    const edgeStrength = this.calculateEdgeStrength(rootNode.id, targetNode.id);
    
    // Calculate importance based on node's centrality in the graph
    const importance = this.calculateNodeImportance(targetNode.id);
    
    // Combine scores with weights
    const combinedScore = 
      (directness * 0.3) + 
      (conceptTypeWeight * 0.2) + 
      (keywordSimilarity * 0.2) + 
      (edgeStrength * 0.2) + 
      (importance * 0.1);

    return {
      directness,
      importance,
      conceptTypeWeight,
      keywordSimilarity,
      combinedScore,
      level: Math.min(4, directness) // Cap at 4 levels
    };
  }

  private calculateShortestPath(sourceId: string, targetId: string): number {
    if (sourceId === targetId) return 0;

    const queue: Array<{ nodeId: string; distance: number }> = [{ nodeId: sourceId, distance: 0 }];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      if (nodeId === targetId) return distance;
      
      const neighbors = this.adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({ nodeId: neighborId, distance: distance + 1 });
        }
      });
    }
    
    return 999; // Not connected
  }

  private calculateConceptTypeCompatibility(rootNode: ConceptNode, targetNode: ConceptNode): number {
    const rootType = rootNode.conceptType || 'Theory';
    const targetType = targetNode.conceptType || 'Theory';
    
    // Define compatibility matrix
    const compatibility: Record<string, Record<string, number>> = {
      'Field': { 'Field': 0.9, 'Theory': 0.8, 'Algorithm': 0.6, 'Tool': 0.5, 'Person': 0.4 },
      'Theory': { 'Field': 0.8, 'Theory': 0.9, 'Algorithm': 0.7, 'Tool': 0.6, 'Person': 0.5 },
      'Algorithm': { 'Field': 0.6, 'Theory': 0.7, 'Algorithm': 0.9, 'Tool': 0.8, 'Person': 0.6 },
      'Tool': { 'Field': 0.5, 'Theory': 0.6, 'Algorithm': 0.8, 'Tool': 0.9, 'Person': 0.7 },
      'Person': { 'Field': 0.4, 'Theory': 0.5, 'Algorithm': 0.6, 'Tool': 0.7, 'Person': 0.9 }
    };
    
    return compatibility[rootType]?.[targetType] || 0.5;
  }

  private calculateKeywordSimilarity(rootNode: ConceptNode, targetNode: ConceptNode): number {
    const rootKeywords = new Set(rootNode.keywords.map(k => k.toLowerCase()));
    const targetKeywords = new Set(targetNode.keywords.map(k => k.toLowerCase()));
    
    if (rootKeywords.size === 0 && targetKeywords.size === 0) return 0.5;
    if (rootKeywords.size === 0 || targetKeywords.size === 0) return 0.1;
    
    const intersection = new Set([...rootKeywords].filter(k => targetKeywords.has(k)));
    const union = new Set([...rootKeywords, ...targetKeywords]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  private calculateEdgeStrength(sourceId: string, targetId: string): number {
    const directEdges = this.edges.filter(edge => 
      (edge.source === sourceId && edge.target === targetId) ||
      (edge.source === targetId && edge.target === sourceId)
    );
    
    if (directEdges.length === 0) return 0.1;
    
    // Strong relationship if there are labeled edges
    const hasLabels = directEdges.some(edge => edge.label && edge.label.trim().length > 0);
    return hasLabels ? 0.9 : 0.6;
  }

  private calculateNodeImportance(nodeId: string): number {
    const connections = this.adjacencyList.get(nodeId)?.length || 0;
    const maxConnections = Math.max(...Array.from(this.adjacencyList.values()).map(arr => arr.length));
    
    if (maxConnections === 0) return 0.5;
    return connections / maxConnections;
  }
}

/**
 * Interface for relationship scoring results
 */
export interface RelationshipScore {
  directness: number;      // Lower = closer (shortest path length)
  importance: number;      // Higher = more important (centrality)
  conceptTypeWeight: number; // Compatibility score
  keywordSimilarity: number; // Keyword overlap score
  combinedScore: number;   // Overall score for positioning
  level: number;           // Assigned level in radial layout
}

/**
 * Linear Focus Layout - arranges nodes in a hierarchical left-to-right structure for Focus Mode
 */
export class LinearFocusLayout {
  private config: LayoutConfig;
  private nodes: ConceptNode[];
  private edges: ConceptEdge[];
  private rootNodeId?: string;

  constructor(
    nodes: ConceptNode[], 
    edges: ConceptEdge[], 
    rootNodeId?: string,
    config: Partial<LayoutConfig> = {}
  ) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
    this.nodes = [...nodes];
    this.edges = edges;
    this.rootNodeId = rootNodeId;
  }

  /**
   * Build a hierarchy tree from the graph structure
   */
  private buildHierarchy(): Map<string, { node: ConceptNode; children: string[]; level: number; parent?: string }> {
    const hierarchy = new Map<string, { node: ConceptNode; children: string[]; level: number; parent?: string }>();
    
    // Initialize all nodes in hierarchy
    this.nodes.forEach(node => {
      hierarchy.set(node.id, {
        node,
        children: [],
        level: 0,
        parent: undefined,
      });
    });

    // Build parent-child relationships from edges
    this.edges.forEach(edge => {
      const parentEntry = hierarchy.get(edge.source);
      const childEntry = hierarchy.get(edge.target);
      
      if (parentEntry && childEntry) {
        parentEntry.children.push(edge.target);
        childEntry.parent = edge.source;
      }
    });

    // Calculate levels using BFS from root nodes
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; level: number }> = [];

    // Find root nodes (nodes with no parents) or use specified root
    if (this.rootNodeId && hierarchy.has(this.rootNodeId)) {
      queue.push({ nodeId: this.rootNodeId, level: 0 });
    } else {
      // Find all nodes without parents as potential roots
      hierarchy.forEach((entry, nodeId) => {
        if (!entry.parent) {
          queue.push({ nodeId, level: 0 });
        }
      });
    }

    // If no roots found, use the first node
    if (queue.length === 0 && this.nodes.length > 0) {
      queue.push({ nodeId: this.nodes[0].id, level: 0 });
    }

    // BFS to assign levels
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const entry = hierarchy.get(nodeId);
      if (entry) {
        entry.level = level;
        
        // Add children to queue with incremented level
        entry.children.forEach(childId => {
          if (!visited.has(childId)) {
            queue.push({ nodeId: childId, level: level + 1 });
          }
        });
      }
    }

    return hierarchy;
  }

  /**
   * Calculate positions for hierarchical linear layout
   */
  public layout(): ConceptNode[] {
    if (this.nodes.length === 0) return [];

    const hierarchy = this.buildHierarchy();
    const levelGroups = new Map<number, string[]>();
    const nodeSpacing = this.config.nodeSpacing;
    const levelHeight = 120; // Vertical spacing between levels
    const nodeWidth = 200; // Estimated node width for spacing calculations
    const startX = 100; // Left margin
    const startY = 100; // Top margin

    // Group nodes by level
    hierarchy.forEach((entry, nodeId) => {
      const level = entry.level;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(nodeId);
    });

    // Sort levels
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    const positionedNodes = new Map<string, { x: number; y: number }>();

    // Position nodes level by level
    sortedLevels.forEach(level => {
      const nodesInLevel = levelGroups.get(level)!;
      const y = startY + level * levelHeight;

      if (level === 0) {
        // Root level - arrange horizontally
        const totalWidth = (nodesInLevel.length - 1) * (nodeWidth + nodeSpacing);
        const levelStartX = startX + Math.max(0, (this.config.width - totalWidth) / 2 - startX);

        nodesInLevel.forEach((nodeId, index) => {
          const x = levelStartX + index * (nodeWidth + nodeSpacing);
          positionedNodes.set(nodeId, { x, y });
        });
      } else {
        // Child levels - position relative to parents
        const positionedInLevel = new Set<string>();

        nodesInLevel.forEach(nodeId => {
          if (positionedInLevel.has(nodeId)) return;

          const entry = hierarchy.get(nodeId);
          if (!entry || !entry.parent) {
            // Orphaned node - position at end
            const x = startX + nodesInLevel.indexOf(nodeId) * (nodeWidth + nodeSpacing);
            positionedNodes.set(nodeId, { x, y });
            positionedInLevel.add(nodeId);
            return;
          }

          const parentPos = positionedNodes.get(entry.parent);
          if (!parentPos) {
            // Parent not positioned yet - position at end
            const x = startX + nodesInLevel.indexOf(nodeId) * (nodeWidth + nodeSpacing);
            positionedNodes.set(nodeId, { x, y });
            positionedInLevel.add(nodeId);
            return;
          }

          // Get all siblings (children of the same parent)
          const parentEntry = hierarchy.get(entry.parent);
          const siblings = parentEntry ? parentEntry.children.filter(childId => 
            levelGroups.get(level)?.includes(childId)
          ) : [nodeId];

          // Position siblings relative to parent
          const totalSiblingsWidth = (siblings.length - 1) * (nodeWidth + nodeSpacing);
          const siblingsStartX = parentPos.x - totalSiblingsWidth / 2;

          siblings.forEach((siblingId, index) => {
            if (!positionedInLevel.has(siblingId)) {
              const x = siblingsStartX + index * (nodeWidth + nodeSpacing);
              positionedNodes.set(siblingId, { x, y });
              positionedInLevel.add(siblingId);
            }
          });
        });
      }
    });

    // Apply positions to nodes
    return this.nodes.map(node => {
      const position = positionedNodes.get(node.id);
      return {
        ...node,
        position: position || { x: 0, y: 0 },
      };
    });
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
    layoutType: 'force-directed' | 'radial' | 'intelligent-radial' | 'linear-focus',
    config: Partial<LayoutConfig> = {},
    rootNodeId?: string
  ): ConceptGraph {
    let layoutEngine: ForceDirectedLayout | RadialLayout | IntelligentRadialLayout | LinearFocusLayout;
    
    if (layoutType === 'radial') {
      if (!rootNodeId && graph.nodes.length > 0) {
        rootNodeId = graph.nodes[0].id; // Default to first node
      }
      if (!rootNodeId) {
        throw new Error('Root node ID is required for radial layout');
      }
      layoutEngine = new RadialLayout(graph.nodes, graph.edges, rootNodeId, config);
    } else if (layoutType === 'intelligent-radial') {
      if (!rootNodeId && graph.nodes.length > 0) {
        rootNodeId = graph.nodes[0].id; // Default to first node
      }
      if (!rootNodeId) {
        throw new Error('Root node ID is required for intelligent radial layout');
      }
      layoutEngine = new IntelligentRadialLayout(graph.nodes, graph.edges, rootNodeId, config);
    } else if (layoutType === 'linear-focus') {
      layoutEngine = new LinearFocusLayout(graph.nodes, graph.edges, rootNodeId, config);
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
 * Apply hierarchical linear focus layout to a graph
 */
export function applyLinearFocusLayout(
  graph: ConceptGraph,
  rootNodeId?: string,
  config: Partial<LayoutConfig> = {}
): ConceptGraph {
  return GraphLayoutUtils.applyLayout(graph, 'linear-focus', config, rootNodeId);
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
    // Use hierarchical linear focus layout for focus mode
    return GraphLayoutUtils.applyLayout(graph, 'linear-focus', config, rootNodeId);
  } else {
    // Intelligent radial or force-directed for exploration mode
    if (rootNodeId && graph.nodes.some(n => n.id === rootNodeId)) {
      return GraphLayoutUtils.applyLayout(graph, 'intelligent-radial', config, rootNodeId);
    } else {
      return GraphLayoutUtils.applyLayout(graph, 'force-directed', config);
    }
  }
} 