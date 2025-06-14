import type { ConceptNode, ConceptEdge, ConceptGraph, ConceptType, ConceptDifficulty } from '../types';

/**
 * Configuration options for graph queries and filtering
 */
export interface QueryConfig {
  /** Maximum depth for traversal operations */
  maxDepth?: number;
  /** Case sensitivity for text searches */
  caseSensitive?: boolean;
  /** Minimum similarity threshold for string matching (0-1) */
  similarityThreshold?: number;
  /** Include partial matches in text search */
  includePartialMatches?: boolean;
}

/**
 * Default query configuration
 */
const DEFAULT_QUERY_CONFIG: QueryConfig = {
  maxDepth: 10,
  caseSensitive: false,
  similarityThreshold: 0.7,
  includePartialMatches: true,
};

/**
 * Filter criteria for node filtering operations
 */
export interface NodeFilterCriteria {
  /** Filter by concept types */
  conceptTypes?: ConceptType[];
  /** Filter by difficulty levels */
  difficulties?: ConceptDifficulty[];
  /** Filter by keywords (any match) */
  keywords?: string[];
  /** Filter by creation date range */
  createdAfter?: Date;
  createdBefore?: Date;
  /** Filter by update date range */
  updatedAfter?: Date;
  updatedBefore?: Date;
  /** Filter nodes that have resources */
  hasResources?: boolean;
  /** Filter nodes that have images */
  hasImage?: boolean;
}

/**
 * Result of a path finding operation
 */
export interface PathResult {
  /** The path as an array of node IDs */
  path: string[];
  /** The total distance/cost of the path */
  distance: number;
  /** Whether a path was found */
  found: boolean;
}

/**
 * Result of a cluster analysis
 */
export interface ClusterResult {
  /** Cluster ID */
  id: string;
  /** Node IDs in this cluster */
  nodeIds: string[];
  /** Central/representative node of the cluster */
  centroid?: string;
  /** Cluster cohesion score (0-1) */
  cohesion: number;
}

/**
 * Graph traversal and query utilities
 */
export class GraphQueryEngine {
  private nodes: Map<string, ConceptNode>;
  private edges: Map<string, ConceptEdge>;
  private adjacencyList: Map<string, string[]>;
  private reverseAdjacencyList: Map<string, string[]>;
  private config: QueryConfig;

  constructor(graph: ConceptGraph, config: Partial<QueryConfig> = {}) {
    this.config = { ...DEFAULT_QUERY_CONFIG, ...config };
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    
    this.buildGraph(graph);
  }

  /**
   * Build internal graph representation for efficient querying
   */
  private buildGraph(graph: ConceptGraph): void {
    // Build node map
    graph.nodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.adjacencyList.set(node.id, []);
      this.reverseAdjacencyList.set(node.id, []);
    });

    // Build edge map and adjacency lists
    graph.edges.forEach(edge => {
      this.edges.set(edge.id, edge);
      
      // Forward adjacency (source -> target)
      const sourceTargets = this.adjacencyList.get(edge.source) || [];
      sourceTargets.push(edge.target);
      this.adjacencyList.set(edge.source, sourceTargets);
      
      // Reverse adjacency (target <- source)
      const targetSources = this.reverseAdjacencyList.get(edge.target) || [];
      targetSources.push(edge.source);
      this.reverseAdjacencyList.set(edge.target, targetSources);
    });
  }

  /**
   * Breadth-First Search traversal starting from a given node
   */
  public breadthFirstTraversal(startNodeId: string, maxDepth?: number): string[] {
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId: startNodeId, depth: 0 }];
    const result: string[] = [];
    const depth = maxDepth || this.config.maxDepth || 10;

    if (!this.nodes.has(startNodeId)) {
      return result;
    }

    while (queue.length > 0) {
      const { nodeId, depth: currentDepth } = queue.shift()!;
      
      if (visited.has(nodeId) || currentDepth > depth) {
        continue;
      }

      visited.add(nodeId);
      result.push(nodeId);

      // Add neighbors to queue
      const neighbors = this.adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({ nodeId: neighborId, depth: currentDepth + 1 });
        }
      });
    }

    return result;
  }

  /**
   * Depth-First Search traversal starting from a given node
   */
  public depthFirstTraversal(startNodeId: string, maxDepth?: number): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const depth = maxDepth || this.config.maxDepth || 10;

    if (!this.nodes.has(startNodeId)) {
      return result;
    }

    const dfs = (nodeId: string, currentDepth: number): void => {
      if (visited.has(nodeId) || currentDepth > depth) {
        return;
      }

      visited.add(nodeId);
      result.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        dfs(neighborId, currentDepth + 1);
      });
    };

    dfs(startNodeId, 0);
    return result;
  }

  /**
   * Find the shortest path between two nodes using BFS
   */
  public findShortestPath(sourceId: string, targetId: string): PathResult {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return { path: [], distance: -1, found: false };
    }

    if (sourceId === targetId) {
      return { path: [sourceId], distance: 0, found: true };
    }

    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[]; distance: number }> = [
      { nodeId: sourceId, path: [sourceId], distance: 0 }
    ];

    while (queue.length > 0) {
      const { nodeId, path, distance } = queue.shift()!;
      
      if (visited.has(nodeId)) {
        continue;
      }

      visited.add(nodeId);

      if (nodeId === targetId) {
        return { path, distance, found: true };
      }

      const neighbors = this.adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({
            nodeId: neighborId,
            path: [...path, neighborId],
            distance: distance + 1
          });
        }
      });
    }

    return { path: [], distance: -1, found: false };
  }

  /**
   * Find all paths between two nodes (up to a maximum depth)
   */
  public findAllPaths(sourceId: string, targetId: string, maxDepth?: number): PathResult[] {
    const paths: PathResult[] = [];
    const depth = maxDepth || this.config.maxDepth || 10;

    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return paths;
    }

    const findPaths = (currentId: string, currentPath: string[], visited: Set<string>, currentDepth: number): void => {
      if (currentDepth > depth) {
        return;
      }

      if (currentId === targetId) {
        paths.push({
          path: [...currentPath],
          distance: currentPath.length - 1,
          found: true
        });
        return;
      }

      const neighbors = this.adjacencyList.get(currentId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          const newVisited = new Set(visited);
          newVisited.add(neighborId);
          findPaths(neighborId, [...currentPath, neighborId], newVisited, currentDepth + 1);
        }
      });
    };

    const visited = new Set([sourceId]);
    findPaths(sourceId, [sourceId], visited, 0);
    
    return paths;
  }

  /**
   * Get all nodes connected to a given node (direct neighbors)
   */
  public getConnectedNodes(nodeId: string, includeIncoming = true, includeOutgoing = true): string[] {
    const connected = new Set<string>();

    if (includeOutgoing) {
      const outgoing = this.adjacencyList.get(nodeId) || [];
      outgoing.forEach(id => connected.add(id));
    }

    if (includeIncoming) {
      const incoming = this.reverseAdjacencyList.get(nodeId) || [];
      incoming.forEach(id => connected.add(id));
    }

    return Array.from(connected);
  }

  /**
   * Filter nodes based on various criteria
   */
  public filterNodes(criteria: NodeFilterCriteria): ConceptNode[] {
    const filtered: ConceptNode[] = [];

    this.nodes.forEach(node => {
      // Check concept type filter
      if (criteria.conceptTypes && criteria.conceptTypes.length > 0) {
        if (!node.conceptType || !criteria.conceptTypes.includes(node.conceptType)) {
          return;
        }
      }

      // Check difficulty filter
      if (criteria.difficulties && criteria.difficulties.length > 0) {
        if (!node.difficulty || !criteria.difficulties.includes(node.difficulty)) {
          return;
        }
      }

      // Check keywords filter
      if (criteria.keywords && criteria.keywords.length > 0) {
        const hasMatchingKeyword = criteria.keywords.some(keyword =>
          node.keywords.some(nodeKeyword =>
            this.config.caseSensitive
              ? nodeKeyword.includes(keyword)
              : nodeKeyword.toLowerCase().includes(keyword.toLowerCase())
          )
        );
        if (!hasMatchingKeyword) {
          return;
        }
      }

      // Check creation date filters
      if (criteria.createdAfter && node.createdAt < criteria.createdAfter) {
        return;
      }
      if (criteria.createdBefore && node.createdAt > criteria.createdBefore) {
        return;
      }

      // Check update date filters
      if (criteria.updatedAfter && node.updatedAt < criteria.updatedAfter) {
        return;
      }
      if (criteria.updatedBefore && node.updatedAt > criteria.updatedBefore) {
        return;
      }

      // Check resources filter
      if (criteria.hasResources !== undefined) {
        const hasResources = node.resources && node.resources.length > 0;
        if (criteria.hasResources !== hasResources) {
          return;
        }
      }

      // Check image filter
      if (criteria.hasImage !== undefined) {
        const hasImage = Boolean(node.imageUrl);
        if (criteria.hasImage !== hasImage) {
          return;
        }
      }

      filtered.push(node);
    });

    return filtered;
  }

  /**
   * Search nodes by text across title, explanation, and keywords
   */
  public searchNodes(query: string, config?: Partial<QueryConfig>): ConceptNode[] {
    const searchConfig = { ...this.config, ...config };
    const searchTerm = searchConfig.caseSensitive ? query : query.toLowerCase();
    const results: ConceptNode[] = [];

    this.nodes.forEach(node => {
      const title = searchConfig.caseSensitive ? node.title : node.title.toLowerCase();
      const explanation = searchConfig.caseSensitive ? node.explanation : node.explanation.toLowerCase();
      const keywords = node.keywords.map(k => searchConfig.caseSensitive ? k : k.toLowerCase());

      // Check for exact or partial matches
      const titleMatch = searchConfig.includePartialMatches
        ? title.includes(searchTerm)
        : title === searchTerm;
      
      const explanationMatch = searchConfig.includePartialMatches
        ? explanation.includes(searchTerm)
        : explanation === searchTerm;
      
      const keywordMatch = keywords.some(keyword =>
        searchConfig.includePartialMatches
          ? keyword.includes(searchTerm)
          : keyword === searchTerm
      );

      if (titleMatch || explanationMatch || keywordMatch) {
        results.push(node);
      }
    });

    return results;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const maxLength = Math.max(len1, len2);
    return maxLength === 0 ? 1 : 1 - (matrix[len1][len2] / maxLength);
  }

  /**
   * Find similar nodes based on title and keyword similarity
   */
  public findSimilarNodes(nodeId: string, threshold?: number): Array<{ node: ConceptNode; similarity: number }> {
    const targetNode = this.nodes.get(nodeId);
    if (!targetNode) {
      return [];
    }

    const similarityThreshold = threshold || this.config.similarityThreshold || 0.7;
    const results: Array<{ node: ConceptNode; similarity: number }> = [];

    this.nodes.forEach(node => {
      if (node.id === nodeId) {
        return; // Skip self
      }

      // Calculate title similarity
      const titleSimilarity = this.calculateSimilarity(
        targetNode.title.toLowerCase(),
        node.title.toLowerCase()
      );

      // Calculate keyword similarity (Jaccard index)
      const targetKeywords = new Set(targetNode.keywords.map(k => k.toLowerCase()));
      const nodeKeywords = new Set(node.keywords.map(k => k.toLowerCase()));
      const intersection = new Set([...targetKeywords].filter(k => nodeKeywords.has(k)));
      const union = new Set([...targetKeywords, ...nodeKeywords]);
      const keywordSimilarity = union.size === 0 ? 0 : intersection.size / union.size;

      // Combined similarity score (weighted average)
      const combinedSimilarity = (titleSimilarity * 0.6) + (keywordSimilarity * 0.4);

      if (combinedSimilarity >= similarityThreshold) {
        results.push({ node, similarity: combinedSimilarity });
      }
    });

    // Sort by similarity (descending)
    return results.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Identify clusters of related concepts using community detection
   */
  public identifyClusters(minClusterSize = 2): ClusterResult[] {
    const visited = new Set<string>();
    const clusters: ClusterResult[] = [];
    let clusterId = 0;

    this.nodes.forEach((_, nodeId) => {
      if (visited.has(nodeId)) {
        return;
      }

      // Find connected component using DFS
      const cluster: string[] = [];
      const stack = [nodeId];

      while (stack.length > 0) {
        const currentId = stack.pop()!;
        if (visited.has(currentId)) {
          continue;
        }

        visited.add(currentId);
        cluster.push(currentId);

        // Add all connected nodes
        const connected = this.getConnectedNodes(currentId);
        connected.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            stack.push(connectedId);
          }
        });
      }

      // Only include clusters that meet minimum size requirement
      if (cluster.length >= minClusterSize) {
        // Calculate cluster cohesion (average connectivity)
        let totalConnections = 0;
        cluster.forEach(id => {
          const connections = this.getConnectedNodes(id).filter(connId => cluster.includes(connId));
          totalConnections += connections.length;
        });
        const cohesion = cluster.length > 1 ? totalConnections / (cluster.length * (cluster.length - 1)) : 1;

        // Find centroid (most connected node in cluster)
        let centroid = cluster[0];
        let maxConnections = 0;
        cluster.forEach(id => {
          const connections = this.getConnectedNodes(id).filter(connId => cluster.includes(connId));
          if (connections.length > maxConnections) {
            maxConnections = connections.length;
            centroid = id;
          }
        });

        clusters.push({
          id: `cluster-${clusterId++}`,
          nodeIds: cluster,
          centroid,
          cohesion
        });
      }
    });

    return clusters.sort((a, b) => b.cohesion - a.cohesion);
  }

  /**
   * Get graph statistics
   */
  public getGraphStatistics() {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.size;
    
    // Calculate degree distribution
    const degrees: number[] = [];
    this.nodes.forEach((_, nodeId) => {
      const degree = this.getConnectedNodes(nodeId).length;
      degrees.push(degree);
    });

    const avgDegree = degrees.length > 0 ? degrees.reduce((sum, d) => sum + d, 0) / degrees.length : 0;
    const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;
    const minDegree = degrees.length > 0 ? Math.min(...degrees) : 0;

    // Calculate density
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    const density = maxPossibleEdges > 0 ? (edgeCount * 2) / maxPossibleEdges : 0;

    return {
      nodeCount,
      edgeCount,
      avgDegree,
      maxDegree,
      minDegree,
      density,
      degrees
    };
  }
}

/**
 * Convenience functions for common graph operations
 */

/**
 * Create a new GraphQueryEngine instance
 */
export function createQueryEngine(graph: ConceptGraph, config?: Partial<QueryConfig>): GraphQueryEngine {
  return new GraphQueryEngine(graph, config);
}

/**
 * Quick search across all text fields of nodes
 */
export function quickSearch(graph: ConceptGraph, query: string, caseSensitive = false): ConceptNode[] {
  const engine = new GraphQueryEngine(graph, { caseSensitive });
  return engine.searchNodes(query);
}

/**
 * Find nodes by specific property values
 */
export function findNodesByProperty<K extends keyof ConceptNode>(
  graph: ConceptGraph,
  property: K,
  value: ConceptNode[K]
): ConceptNode[] {
  return graph.nodes.filter(node => node[property] === value);
}

/**
 * Get all nodes of specific types
 */
export function getNodesByType(graph: ConceptGraph, types: ConceptType[]): ConceptNode[] {
  return graph.nodes.filter(node => node.conceptType && types.includes(node.conceptType));
}

/**
 * Get all nodes of specific difficulty levels
 */
export function getNodesByDifficulty(graph: ConceptGraph, difficulties: ConceptDifficulty[]): ConceptNode[] {
  return graph.nodes.filter(node => node.difficulty && difficulties.includes(node.difficulty));
}

/**
 * Find nodes created within a date range
 */
export function getNodesInDateRange(
  graph: ConceptGraph,
  startDate: Date,
  endDate: Date,
  useUpdateDate = false
): ConceptNode[] {
  return graph.nodes.filter(node => {
    const date = useUpdateDate ? node.updatedAt : node.createdAt;
    return date >= startDate && date <= endDate;
  });
}

/**
 * Get nodes that have external resources
 */
export function getNodesWithResources(graph: ConceptGraph): ConceptNode[] {
  return graph.nodes.filter(node => node.resources && node.resources.length > 0);
}

/**
 * Get nodes that have images
 */
export function getNodesWithImages(graph: ConceptGraph): ConceptNode[] {
  return graph.nodes.filter(node => Boolean(node.imageUrl));
} 