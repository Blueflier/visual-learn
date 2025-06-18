# Concept Nodes Refactor Plan: From Fixed Types to AI-Driven Dynamic Concepts

## Current Issues with Implementation

### 1. **Hardcoded Concept Types Limitation**
- Currently constrained to 5 fixed concept types: `Field`, `Theory`, `Algorithm`, `Tool`, `Person`
- These types are hardcoded across multiple files, limiting flexibility
- User queries are forced into these predefined categories regardless of domain or context
- No ability for the system to adapt to different domains (finance, gaming, science, etc.)

### 2. **Rigid Visual System**
- Each concept type has predefined colors, icons, and styling
- No flexibility for domain-specific visual representation
- Visual hierarchy is based on hardcoded weights rather than contextual importance

### 3. **Static Layout Weights**
- Layout positioning is based on hardcoded concept type weights
- No ability for AI to determine contextual importance or relationships
- Limits the system's ability to create meaningful visual hierarchies

### 4. **Poor User Experience**
- Users must understand and work within our predefined taxonomy
- No exploratory or discovery process for understanding user intent
- Lacks the flexibility needed for both task-focused and exploration modes

## Proposed Solution: AI-Driven Dynamic Concept System

### Core Philosophy
1. **AI-First Approach**: Let AI determine concept types based on user intent and domain
2. **User Collaboration**: Engage users in defining their exploration/task space
3. **Flexible Visual System**: Generic styling with user customization options
4. **Context-Aware Layouts**: AI-determined relationships and importance weights

### Two Primary Modes

#### 1. **Focus Mode (Task-Oriented)**
- User inputs a goal/task they want to accomplish
- AI breaks down the task into logical subtasks and dependencies
- Creates a hierarchical graph showing the path to completion
- Main task node at left, path to success flows towards the right, subtasks flow off of the main tasks

#### 2. **Exploration Mode (Knowledge Discovery)**
- User inputs a topic they want to explore
- AI identifies related concepts, tools, resources, and connections
- Creates an interconnected graph of related knowledge
- Central concepts more prominent, with related ideas branching outward

## Implementation Plan

### Phase 1: Remove Hardcoded Concept Types

#### Files to Modify:

**`src/types/index.ts`**
```typescript
// REMOVE: Fixed ConceptType union
// export type ConceptType = 'Field' | 'Theory' | 'Algorithm' | 'Tool' | 'Person';

// ADD: Dynamic concept type system
export interface ConceptNode {
  id: string;
  title: string;
  explanation: string;
  keywords: string[];
  conceptType?: string; // Now a flexible string instead of union type
  customColor?: string; // User-defined color override
  importance?: number; // AI-determined importance (0-1)
  position: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
  resources: string[];
  imageUrl?: string;
}

export interface GraphMetadata {
  mode: 'focus' | 'exploration';
  userQuery: string;
  conceptTypes: string[]; // AI-generated list of concept types for this graph
  primaryConcept?: string; // Main focus node for task mode
}
```

**`src/utils/graphLayout.ts`**
```typescript
// REMOVE: getConceptTypeWeight method with hardcoded weights
// ADD: AI-driven importance calculation
private getNodeImportance(node: ConceptNode, metadata: GraphMetadata): number {
  // Use AI-determined importance score
  if (node.importance !== undefined) {
    return node.importance;
  }
  
  // Fallback: central node gets highest importance in focus mode
  if (metadata.mode === 'focus' && node.id === metadata.primaryConcept) {
    return 1.0;
  }
  
  // Default importance for exploration mode
  return 0.5;
}
```

**`src/components/ConceptNode.tsx`**
```typescript
// REMOVE: getConceptTypeIcon function with hardcoded icons
// ADD: Generic or user-customizable icon system
const getConceptIcon = (type?: string) => {
  // Generic icon for all concepts, or allow user customization later
  return '📝';
};
```

**`src/components/MainCanvas.tsx`**
```typescript
// REMOVE: Hardcoded color switching based on concept types
// ADD: Generic color system with user overrides
const getNodeColor = (node: ConceptNode) => {
  if (node.customColor) {
    return node.customColor;
  }
  
  // Default to React Flow's default colors or simple grayscale
  return '#6b7280'; // Generic gray
};
```

**`src/utils/reactFlowIntegration.ts`**
```typescript
// REMOVE: CONCEPT_TYPE_STYLES constant
// ADD: Dynamic styling system
const getNodeStyle = (node: ConceptNode) => ({
  backgroundColor: node.customColor || '#ffffff',
  borderColor: '#6b7280',
  textColor: '#1f2937',
  borderWidth: 1,
});
```

### Phase 2: Add AI Intent Discovery System

#### New Files to Create:

**`src/services/intentDiscovery.ts`**
```typescript
export interface UserIntent {
  mode: 'focus' | 'exploration';
  domain: string;
  primaryGoal: string;
  suggestedConceptTypes: string[];
  clarifyingQuestions?: string[];
}

export class IntentDiscoveryService {
  async analyzeUserQuery(query: string): Promise<UserIntent> {
    // Initial LLM call to understand user intent
    // Determine if this is task-focused or exploratory
    // Identify domain and suggest relevant concept types
    // Generate clarifying questions if domain is unclear
  }

  async refineIntent(
    originalIntent: UserIntent, 
    userResponses: Record<string, string>
  ): Promise<UserIntent> {
    // Refine understanding based on user feedback
  }
}
```

**`src/services/graphGeneration.ts`**
```typescript
export interface GraphGenerationRequest {
  userIntent: UserIntent;
  confirmedConceptTypes: string[];
  maxNodes?: number;
}

export class GraphGenerationService {
  async generateGraph(request: GraphGenerationRequest): Promise<{
    nodes: ConceptNode[];
    edges: ConceptEdge[];
    metadata: GraphMetadata;
  }> {
    if (request.userIntent.mode === 'focus') {
      return this.generateTaskGraph(request);
    } else {
      return this.generateExplorationGraph(request);
    }
  }

  private async generateTaskGraph(request: GraphGenerationRequest) {
    // Create hierarchical task breakdown
    // Main task at center, subtasks as dependencies
    // AI determines logical progression and relationships
  }

  private async generateExplorationGraph(request: GraphGenerationRequest) {
    // Create interconnected knowledge graph
    // AI determines related concepts and their relationships
    // Use importance scores for layout positioning
  }
}
```

### Phase 3: Update UI Flow

#### Files to Modify:

**`src/components/UserQueryInterface.tsx` (New Component)**
- Initial query input
- Intent confirmation dialog
- Concept type refinement interface
- Clarifying questions display

**`src/components/ConceptTypeSelector.tsx` (New Component)**
- Display AI-suggested concept types
- Allow user to confirm, modify, or add types
- Advanced mode for manual type definition

**`src/hooks/useGraphGeneration.ts` (New Hook)**
- Manage the multi-step graph creation process
- Handle intent discovery, user feedback, and graph generation
- Provide loading states and error handling

### Phase 4: Advanced Features (Future)

1. **User Customization**
   - Click to change node colors
   - Custom icons for concept types
   - Save preferred concept type definitions

2. **AI Learning**
   - Remember user preferences for domains
   - Improve concept type suggestions over time
   - Learn from user modifications to generated graphs

3. **Export/Import**
   - Save custom concept type definitions
   - Share graph templates between users
   - Export graphs with custom styling

## Files That Need Changes

### Immediate Changes Required:
- ✅ `src/types/index.ts` - Remove fixed ConceptType, add flexibility
- ✅ `src/utils/graphLayout.ts` - Replace hardcoded weights with AI importance
- ✅ `src/components/ConceptNode.tsx` - Remove hardcoded icons
- ✅ `src/components/MainCanvas.tsx` - Remove hardcoded colors
- ✅ `src/utils/reactFlowIntegration.ts` - Remove fixed styling system
- ✅ `tests/utils/graphQuery.test.ts` - Update test concept types
- ✅ `tests/utils/intelligentRadialLayout.test.ts` - Update test helpers

### New Files to Create:
- ✅ `src/services/intentDiscovery.ts` - AI intent analysis
- ✅ `src/services/graphGeneration.ts` - Dynamic graph creation
- ✅ `src/components/UserQueryInterface.tsx` - Query input and refinement
- ✅ `src/components/ConceptTypeSelector.tsx` - Type selection interface
- ✅ `src/hooks/useGraphGeneration.ts` - Graph generation workflow

## Success Metrics

1. **Flexibility**: Users can create graphs for any domain without being constrained by predefined types
2. **Intelligence**: AI successfully identifies user intent and suggests relevant concept types
3. **User Experience**: Smooth flow from query to graph generation with minimal friction
4. **Visual Quality**: Generated graphs are visually appealing and logically organized
5. **Customization**: Users can personalize their graphs while maintaining good defaults

## Risk Mitigation

1. **AI Reliability**: Implement fallback systems for when AI suggestions are poor
2. **Performance**: Ensure AI calls don't significantly slow down the user experience
3. **User Confusion**: Provide clear guidance and examples for the new flexible system
4. **Visual Chaos**: Maintain good default styling even with unlimited concept types

This refactor will transform the application from a rigid, predefined system to a flexible, AI-driven tool that adapts to user needs and domains. 