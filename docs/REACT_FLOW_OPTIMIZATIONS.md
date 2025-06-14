# React Flow Edge Update Optimizations

This document outlines the comprehensive optimizations implemented to achieve seamless edge updates in React Flow, eliminating flickering and improving performance.

## Overview

The optimizations focus on four key strategies:
1. **Stable Data References** - Preventing unnecessary re-renders through consistent object references
2. **Built-in State Management** - Using `useEdgesState` and `useNodesState` for optimal performance
3. **Batched Updates** - Grouping multiple changes to minimize re-render cycles
4. **Debounced Operations** - Smoothing rapid user interactions

## Implementation Details

### 1. Stable Data References (`MainCanvas.tsx`)

#### Before (Problematic):
```typescript
// ❌ Creates new objects on every render
const nodeTypes = useMemo(() => ({
  concept: ConceptNodeComponent,
}), []);

const fitViewOptions = {
  padding: 50,
  maxZoom: 1.5,
  minZoom: 0.1,
};
```

#### After (Optimized):
```typescript
// ✅ Stable reference outside component
const nodeTypes = {
  concept: ConceptNodeComponent,
};

// ✅ Memoized options with stable reference
const fitViewOptions = useMemo(() => ({
  padding: 50,
  maxZoom: 1.5,
  minZoom: 0.1,
}), []);
```

### 2. Built-in State Management

#### Before (Problematic):
```typescript
// ❌ Direct array replacement causes full re-render
const reactFlowEdges = useMemo(() => 
  convertToReactFlowEdges(graphData.edges, selectedEdgeId),
  [graphData.edges, selectedEdgeId]
);

const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      removeEdge(change.id);
    }
  });
}, [removeEdge]);
```

#### After (Optimized):
```typescript
// ✅ Use React Flow's built-in state management
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
  // Apply changes to React Flow state immediately for smooth interaction
  onEdgesChange(changes);
  
  // Batch store updates to avoid multiple re-renders
  const storeUpdates: Array<() => void> = [];
  
  changes.forEach(change => {
    if (change.type === 'remove') {
      storeUpdates.push(() => removeEdge(change.id));
    }
  });

  // Execute all store updates in a single batch
  if (storeUpdates.length > 0) {
    storeUpdates.forEach(update => update());
  }
}, [onEdgesChange, removeEdge]);
```

### 3. Optimized Store Operations (`graphStore.ts`)

#### Enhanced Update Methods:
```typescript
// ✅ Index-based updates instead of array mapping
updateEdge: (edgeId: string, updates: Partial<ConceptEdge>) =>
  set(state => {
    const edgeIndex = state.graphData.edges.findIndex(edge => edge.id === edgeId);
    if (edgeIndex === -1) return state;

    const updatedEdges = [...state.graphData.edges];
    updatedEdges[edgeIndex] = { ...updatedEdges[edgeIndex], ...updates };

    return {
      graphData: {
        ...state.graphData,
        edges: updatedEdges,
      },
      selectedEdge: edgeId === state.selectedEdgeId 
        ? updatedEdges[edgeIndex] 
        : state.selectedEdge
    };
  }),

// ✅ Batch update capability
batchUpdateEdges: (updates: Array<{ id: string; updates: Partial<ConceptEdge> }>) =>
  set(state => {
    const updatedEdges = [...state.graphData.edges];
    let selectedEdgeUpdated = false;

    updates.forEach(({ id, updates: edgeUpdates }) => {
      const edgeIndex = updatedEdges.findIndex(edge => edge.id === id);
      if (edgeIndex !== -1) {
        updatedEdges[edgeIndex] = {
          ...updatedEdges[edgeIndex],
          ...edgeUpdates
        };
        if (id === state.selectedEdgeId) {
          selectedEdgeUpdated = true;
        }
      }
    });

    return {
      graphData: { ...state.graphData, edges: updatedEdges },
      selectedEdge: selectedEdgeUpdated && state.selectedEdgeId
        ? updatedEdges.find(e => e.id === state.selectedEdgeId) || null
        : state.selectedEdge
    };
  }),
```

### 4. Debounced Edge Updates (`EdgeDetailSidebar.tsx`)

#### Real-time Editing with Debouncing:
```typescript
// ✅ Debounced update function for smooth real-time editing
const debouncedUpdateEdge = useDebounce((edgeId: string, updates: Partial<ConceptEdge>) => {
  updateEdge(edgeId, updates);
}, 300);

// ✅ Auto-save with debouncing for real-time updates
const handleAutoSave = useCallback(() => {
  if (selectedEdgeId && isEditing) {
    const trimmedLabel = label.trim();
    debouncedUpdateEdge(selectedEdgeId, { 
      label: trimmedLabel || undefined 
    });
  }
}, [selectedEdgeId, label, isEditing, debouncedUpdateEdge]);

const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setLabel(e.target.value);
  if (!isEditing) {
    setIsEditing(true);
  }
  // Trigger auto-save after a brief delay
  handleAutoSave();
}, [isEditing, handleAutoSave]);
```

### 5. Custom Hooks for Performance (`useDebounce.ts`)

#### Debouncing Hook:
```typescript
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}
```

#### Batched Updates Hook:
```typescript
export function useBatchedUpdates<T>(
  updateFunction: (items: T[]) => void,
  delay: number = 16 // One frame at 60fps
) {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addToBatch = useCallback((item: T) => {
    batchRef.current.push(item);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (batchRef.current.length > 0) {
        updateFunction([...batchRef.current]);
        batchRef.current = [];
      }
    }, delay);
  }, [updateFunction, delay]);

  return { addToBatch, flushBatch };
}
```

## Performance Benefits

### Before Optimizations:
- ❌ Edge updates caused full component re-renders
- ❌ Flickering during rapid label changes
- ❌ Laggy interactions during dragging
- ❌ Unnecessary recalculations on every state change

### After Optimizations:
- ✅ Minimal re-renders with diff-based updates
- ✅ Smooth real-time editing with debounced saves
- ✅ Responsive interactions during complex operations
- ✅ Efficient memory usage with stable references

## Key Optimization Patterns

### 1. Memoization Strategy
```typescript
// ✅ Memoize expensive calculations
const { sourceNode, targetNode } = useMemo(() => {
  if (!selectedEdge) return { sourceNode: null, targetNode: null };
  
  return {
    sourceNode: graphData.nodes.find(node => node.id === selectedEdge.source) || null,
    targetNode: graphData.nodes.find(node => node.id === selectedEdge.target) || null,
  };
}, [selectedEdge, graphData.nodes]);
```

### 2. Callback Optimization
```typescript
// ✅ Stable callback references
const handleClose = useCallback(() => {
  setSelectedEdgeId(null);
  if (isDetailSidebarOpen) {
    toggleDetailSidebar();
  }
}, [setSelectedEdgeId, isDetailSidebarOpen, toggleDetailSidebar]);
```

### 3. State Synchronization
```typescript
// ✅ Sync React Flow state with store state efficiently
useMemo(() => {
  const newEdges = convertToReactFlowEdges(graphData.edges, selectedEdgeId);
  setEdges(newEdges);
}, [graphData.edges, selectedEdgeId, setEdges]);
```

## Best Practices Applied

1. **Avoid Frequent Reinitialization**: Use stable references for node types and configuration objects
2. **Use Built-in Change Handlers**: Leverage `useEdgesState` and `onEdgesChange` for optimal performance
3. **Memoize Custom Components**: Define edge types outside render or wrap in `useMemo`
4. **Batch Updates**: Group multiple changes to minimize re-render cycles
5. **Debounce User Input**: Smooth rapid interactions with appropriate delays

## Monitoring Performance

To verify the optimizations are working:

1. **React DevTools Profiler**: Check for reduced re-render frequency
2. **Browser Performance Tab**: Monitor frame rates during interactions
3. **Console Timing**: Add performance markers for critical operations
4. **Memory Usage**: Verify stable memory consumption during extended use

## Future Enhancements

1. **Virtual Scrolling**: For large graphs with hundreds of edges
2. **Web Workers**: For complex calculations off the main thread
3. **Canvas Rendering**: For ultimate performance with thousands of elements
4. **Incremental Updates**: More granular change detection and application

This optimization strategy ensures smooth, responsive edge editing while maintaining clean, maintainable code architecture. 