/**
 * Defines the type of a concept, which can be a general field, a specific theory,
 * an algorithm, a tool, or a person of interest in the field.
 */
export type ConceptType = 'Field' | 'Theory' | 'Algorithm' | 'Tool' | 'Person';

/**
 * Defines the difficulty level of a concept.
 */
export type ConceptDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

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
  /** The difficulty level of the concept. */
  difficulty?: ConceptDifficulty;
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
 * Represents a directional link between two concept nodes.
 */
export interface ConceptEdge {
  /** A unique identifier for the edge. */
  id: string;
  /** The ID of the source node. */
  source: string;
  /** The ID of the target node. */
  target: string;
  /** A label describing the relationship between the source and target nodes. */
  label?: string;
}

/**
 * Represents the entire concept graph, including all nodes and edges.
 */
export interface ConceptGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

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
 */
export interface AppState {
  graphData: ConceptGraph;
  viewState: GraphViewState;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  selectedNode: ConceptNode | null;
  selectedEdge: ConceptEdge | null;
  isSettingsPanelOpen: boolean;
  isDetailSidebarOpen: boolean;
}

// Re-export as type exports for clarity
export type { ConceptNode as Node, ConceptEdge as Edge }; 