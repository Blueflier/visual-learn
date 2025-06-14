import { useEffect, useState } from 'react';
import { useGraphStore } from '../store/graphStore';

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

  // Update local state when selected edge changes
  useEffect(() => {
    if (selectedEdge) {
      setLabel(selectedEdge.label || '');
    }
  }, [selectedEdge]);

  // Auto-open sidebar when an edge is selected
  useEffect(() => {
    if (selectedEdge && !isDetailSidebarOpen) {
      toggleDetailSidebar();
    }
  }, [selectedEdge, isDetailSidebarOpen, toggleDetailSidebar]);

  if (!selectedEdge) return null;

  // Find source and target node details
  const sourceNode = graphData.nodes.find(node => node.id === selectedEdge.source);
  const targetNode = graphData.nodes.find(node => node.id === selectedEdge.target);

  const handleClose = () => {
    setSelectedEdgeId(null);
    if (isDetailSidebarOpen) {
      toggleDetailSidebar();
    }
  };

  const handleSave = () => {
    if (selectedEdgeId) {
      updateEdge(selectedEdgeId, { label: label.trim() || undefined });
    }
  };

  const handleDelete = () => {
    if (selectedEdgeId) {
      const sourceTitle = sourceNode ? sourceNode.title : selectedEdge.source;
      const targetTitle = targetNode ? targetNode.title : selectedEdge.target;
      const edgeLabel = selectedEdge.label ? ` "${selectedEdge.label}"` : '';
      
      const confirmMessage = `Are you sure you want to delete the edge${edgeLabel} connecting:\n\n"${sourceTitle}" → "${targetTitle}"`;
      
      if (window.confirm(confirmMessage)) {
        removeEdge(selectedEdgeId);
        handleClose();
      }
    }
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

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
            <input 
              type="text" 
              value={label}
              onChange={handleLabelChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter edge label (e.g., 'relates to', 'depends on')"
            />
          </div>
        </div>

        <div className="detail-section">
          <h4>Connection</h4>
          <div className="detail-item">
            <label>From:</label>
            <span className="node-reference">
              {sourceNode ? sourceNode.title : selectedEdge.source}
            </span>
          </div>
          <div className="detail-item">
            <label>To:</label>
            <span className="node-reference">
              {targetNode ? targetNode.title : selectedEdge.target}
            </span>
          </div>
        </div>

        <div className="detail-section">
          <h4>Actions</h4>
          <button 
            className="action-button save"
            onClick={handleSave}
          >
            Save Changes
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
  );
};

export default EdgeDetailSidebar; 