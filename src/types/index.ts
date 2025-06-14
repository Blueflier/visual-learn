/**
 * Defines the type of a concept, which can be a general field, a specific theory,
 * an algorithm, a tool, or a person of interest in the field.
 */
export type ConceptType = 'Field' | 'Theory' | 'Algorithm' | 'Tool' | 'Person';

/**
 * Represents a single concept node in the graph.
 * This is the core data structure for a concept.
 */
export type ConceptNode = {
  [key: string]: unknown; // Index signature for React Flow compatibility
  /** A unique identifier for the node. */
  id: string;
  /** The title or name of the concept. */
  title: string;
  /** A list of keywords associated with the concept. */
  keywords: string[];
  /** A detailed explanation of the concept. */
  explanation: string;
  /** The type of the concept. */
  conceptType?: ConceptType;
  /** The (x, y) coordinates of the node on the canvas. */
  position?: { x: number; y: number };
  /** The date and time when the concept was created. */
  createdAt: Date;
  /** The date and time when the concept was last updated. */
  updatedAt: Date;
  /** An array of URLs to external resources for further learning. */
  resources: string[];
  /** A URL for an image representing the concept. */
  imageUrl?: string;
};

/**
 * Represents a connection between two concept nodes.
 */
export type ConceptEdge = {
  [key: string]: unknown; // Index signature for React Flow compatibility
  /** A unique identifier for the edge. */
  id: string;
  /** The ID of the source node. */
  source: string;
  /** The ID of the target node. */
  target: string;
  /** An optional label for the edge. */
  label?: string;
};

/**
 * Represents the entire concept graph, including all nodes and edges.
 */
export type ConceptGraph = {
  /** All nodes in the graph. */
  nodes: ConceptNode[];
  /** All edges in the graph. */
  edges: ConceptEdge[];
};

/**
 * Represents the state of the graph view.
 */
export interface GraphViewState {
  /** The current zoom level. */
  zoom: number;
  /** The current pan/offset of the view. */
  pan: { x: number, y: number };
  /** The mode of interaction with the graph. */
  mode: 'focus' | 'exploration';
  /** The ID of the root concept in focus mode. */
  rootConceptId?: string;
}

/**
 * The main application state, combining graph data, view state, and user selection.
 * Updated to support multi-selection while maintaining backward compatibility.
 */
export interface AppState {
  graphData: ConceptGraph;
  viewState: GraphViewState;
  
  // Multi-selection arrays (primary selection state)
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  
  // Legacy single selection (computed from arrays for backward compatibility)
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  
  // Computed selected objects (derived from selection arrays)
  selectedNode: ConceptNode | null;
  selectedEdge: ConceptEdge | null;
  
  // UI state
  isSettingsPanelOpen: boolean;
  isDetailSidebarOpen: boolean;
}

// Re-export as type exports for clarity
export type { ConceptNode as Node, ConceptEdge as Edge }; 