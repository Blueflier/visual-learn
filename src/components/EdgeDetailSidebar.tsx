import { useEffect, useState, useCallback, useMemo } from 'react';
import { useGraphStore } from '../store/graphStore';
import { useDebounce } from '../hooks/useDebounce';
import type { ConceptEdge } from '../types';
import '../styles/EdgeDetailSidebar.css';

const EdgeDetailSidebar = () => {
  const { 
    selectedEdge, 
    selectedEdgeId,
    isDetailSidebarOpen, 
    toggleDetailSidebar, 
    setSelectedEdgeId,
    updateEdge,
    removeEdge,
    graphData
  } = useGraphStore();

  const [label, setLabel] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Memoize source and target node lookups to prevent unnecessary recalculations
  const { sourceNode, targetNode } = useMemo(() => {
    if (!selectedEdge) return { sourceNode: null, targetNode: null };
    
    return {
      sourceNode: graphData.nodes.find(node => node.id === selectedEdge.source) || null,
      targetNode: graphData.nodes.find(node => node.id === selectedEdge.target) || null,
    };
  }, [selectedEdge, graphData.nodes]);

  // Update local state when selected edge changes
  useEffect(() => {
    if (selectedEdge) {
      setLabel(selectedEdge.label || '');
      setIsEditing(false);
    }
  }, [selectedEdge]);

  // Auto-open sidebar when an edge is selected
  useEffect(() => {
    if (selectedEdge && !isDetailSidebarOpen) {
      toggleDetailSidebar();
    }
  }, [selectedEdge, isDetailSidebarOpen, toggleDetailSidebar]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleClose = useCallback(() => {
    setSelectedEdgeId(null);
    if (isDetailSidebarOpen) {
      toggleDetailSidebar();
    }
  }, [setSelectedEdgeId, isDetailSidebarOpen, toggleDetailSidebar]);

  // Debounced update function for smooth real-time editing
  const debouncedUpdateEdge = useDebounce((edgeId: string, updates: Partial<ConceptEdge>) => {
    updateEdge(edgeId, updates);
  }, 300);

  const handleSave = useCallback(() => {
    if (selectedEdgeId) {
      const trimmedLabel = label.trim();
      updateEdge(selectedEdgeId, { 
        label: trimmedLabel || undefined 
      });
      setIsEditing(false);
    }
  }, [selectedEdgeId, label, updateEdge]);

  // Auto-save with debouncing for real-time updates
  const handleAutoSave = useCallback(() => {
    if (selectedEdgeId && isEditing) {
      const trimmedLabel = label.trim();
      debouncedUpdateEdge(selectedEdgeId, { 
        label: trimmedLabel || undefined 
      });
    }
  }, [selectedEdgeId, label, isEditing, debouncedUpdateEdge]);

  const handleDelete = useCallback(() => {
    if (selectedEdgeId && selectedEdge) {
      const sourceTitle = sourceNode ? sourceNode.title : selectedEdge.source;
      const targetTitle = targetNode ? targetNode.title : selectedEdge.target;
      const edgeLabel = selectedEdge.label ? ` "${selectedEdge.label}"` : '';
      
      const confirmMessage = `Are you sure you want to delete the edge${edgeLabel} connecting:\n\n"${sourceTitle}" → "${targetTitle}"`;
      
      if (window.confirm(confirmMessage)) {
        removeEdge(selectedEdgeId);
        handleClose();
      }
    }
  }, [selectedEdgeId, selectedEdge, sourceNode, targetNode, removeEdge, handleClose]);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    if (!isEditing) {
      setIsEditing(true);
    }
    // Trigger auto-save after a brief delay
    handleAutoSave();
  }, [isEditing, handleAutoSave]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      // Reset to original value on escape
      if (selectedEdge) {
        setLabel(selectedEdge.label || '');
        setIsEditing(false);
      }
    }
  }, [handleSave, selectedEdge]);

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    // Auto-save on blur if there are changes
    if (isEditing) {
      handleSave();
    }
  }, [isEditing, handleSave]);

  // Memoized connection display to prevent unnecessary recalculations
  const connectionDisplay = useMemo(() => {
    if (!selectedEdge) return null;
    
    return {
      sourceTitle: sourceNode ? sourceNode.title : selectedEdge.source,
      targetTitle: targetNode ? targetNode.title : selectedEdge.target,
    };
  }, [selectedEdge, sourceNode, targetNode]);

  if (!selectedEdge) return null;

  return (
    <div className="edge-detail-sidebar">
      <div className="sidebar-header">
        <h3>Edge Details</h3>
        <button onClick={handleClose} className="close-button">
          ×
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="detail-section">
          <h4>Basic Information</h4>
          <div className="detail-item">
            <label>ID:</label>
            <span>{selectedEdge.id}</span>
          </div>
          <div className="detail-item">
            <label>Label:</label>
            <div className="input-container">
              <input 
                type="text" 
                value={label}
                onChange={handleLabelChange}
                onKeyDown={handleKeyPress}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Enter edge label (e.g., 'relates to', 'depends on')"
                className={isEditing ? 'editing' : ''}
              />
              {isEditing && (
                <div className="edit-indicators">
                  <span className="edit-hint">Press Enter to save, Esc to cancel</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Connection</h4>
          <div className="detail-item">
            <label>From:</label>
            <span className="node-reference">
              {connectionDisplay?.sourceTitle}
            </span>
          </div>
          <div className="detail-item">
            <label>To:</label>
            <span className="node-reference">
              {connectionDisplay?.targetTitle}
            </span>
          </div>
        </div>

        <div className="detail-section">
          <h4>Actions</h4>
          <div className="action-buttons">
            <button 
              className={`action-button save ${isEditing ? 'highlight' : ''}`}
              onClick={handleSave}
              disabled={!isEditing}
            >
              {isEditing ? 'Save Changes' : 'Saved'}
            </button>
            <button 
              className="action-button delete"
              onClick={handleDelete}
            >
              Delete Edge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdgeDetailSidebar; 