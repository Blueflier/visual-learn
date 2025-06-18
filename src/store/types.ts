import type {
  AppState,
  ConceptNode,
  ConceptEdge,
  ConceptGraph,
} from '../types';

// Enhanced state interface with multi-selection support
export interface EnhancedAppState extends Omit<AppState, 'selectedNodeId' | 'selectedEdgeId'> {
  // Multi-selection arrays
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  
  // Legacy single selection (updated by actions)
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // Context menu state
  contextMenu?: ContextMenuData | null;
}

// Node-related actions
export interface NodeActions {
  addNode: (node: ConceptNode) => void;
  updateNode: (nodeId: string, updates: Partial<ConceptNode>) => void;
  removeNode: (nodeId: string) => void;
  batchUpdateNodes: (updates: Array<{ id: string; updates: Partial<ConceptNode> }>) => void;
  
  // Node expansion/collapse actions
  toggleNodeExpansion: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  
  // Node refocusing action
  focusOnNode: (nodeId: string) => void;
}

// Edge-related actions
export interface EdgeActions {
  addEdge: (edge: ConceptEdge) => void;
  updateEdge: (edgeId: string, updates: Partial<ConceptEdge>) => void;
  removeEdge: (edgeId: string) => void;
  batchUpdateEdges: (updates: Array<{ id: string; updates: Partial<ConceptEdge> }>) => void;
}

// Selection-related actions
export interface SelectionActions {
  // Single selection (legacy support)
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedEdgeId: (edgeId: string | null) => void;
  
  // Multi-selection support
  setSelectedNodeIds: (nodeIds: string[]) => void;
  setSelectedEdgeIds: (edgeIds: string[]) => void;
  addToNodeSelection: (nodeId: string) => void;
  removeFromNodeSelection: (nodeId: string) => void;
  addToEdgeSelection: (edgeId: string) => void;
  removeFromEdgeSelection: (edgeId: string) => void;
  clearSelection: () => void;
}

// Graph-level operations
export interface GraphActions {
  setRootConceptId: (nodeId?: string) => void;
  toggleMode: () => void;
  setMode: (mode: 'focus' | 'exploration') => void;
  clearGraph: () => void;
  
  // Import/Export operations
  exportToJSON: () => string;
  importFromJSON: (jsonString: string) => Promise<{ success: boolean; error?: string }>;
  loadGraph: (graph: ConceptGraph) => void;
}

// Context menu data structure
export interface ContextMenuData {
  x: number;
  y: number;
  mode: 'focus' | 'exploration';
  nearbyNodeId?: string;
}

// UI state actions
export interface UIActions {
  toggleSettingsPanel: () => void;
  toggleDetailSidebar: () => void;
  setDetailSidebarOpen: (open: boolean) => void;
  
  // Context menu actions
  createContextMenu: (data: ContextMenuData) => void;
  closeContextMenu: () => void;
}

// Derived state selectors
export interface Selectors {
  // Node selectors
  getNodeById: (nodeId: string) => ConceptNode | undefined;
  getNodesByIds: (nodeIds: string[]) => ConceptNode[];
  getSelectedNodes: () => ConceptNode[];
  
  // Edge selectors
  getEdgeById: (edgeId: string) => ConceptEdge | undefined;
  getEdgesByIds: (edgeIds: string[]) => ConceptEdge[];
  getSelectedEdges: () => ConceptEdge[];
  
  // Graph query selectors
  getConnectedNodes: (nodeId: string) => ConceptNode[];
  getEdgesBetweenNodes: (sourceId: string, targetId: string) => ConceptEdge[];
  getNodeEdges: (nodeId: string) => ConceptEdge[];
  
  // Selection state selectors
  isNodeSelected: (nodeId: string) => boolean;
  isEdgeSelected: (edgeId: string) => boolean;
  hasSelection: () => boolean;
  getSelectionCount: () => { nodes: number; edges: number };
}

// Combined actions interface
export interface Actions extends 
  NodeActions, 
  EdgeActions, 
  SelectionActions, 
  GraphActions, 
  UIActions {}

// Store state getter/setter types
export type StoreGet = () => EnhancedAppState & Actions & Selectors;
export type StoreSet = (
  partial: EnhancedAppState | Partial<EnhancedAppState> | ((state: EnhancedAppState & Actions & Selectors) => EnhancedAppState | Partial<EnhancedAppState>),
  replace?: false | undefined
) => void; 