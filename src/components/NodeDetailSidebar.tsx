import { useGraphStore } from '../store/graphStore';
import { useState, useEffect } from 'react';
import type { ConceptType } from '../types';
import '../styles/NodeDetailSidebar.css';

const NodeDetailSidebar = () => {
  const { selectedNode, isDetailSidebarOpen, setSelectedNodeId, updateNode } = useGraphStore();
  
  // Local state for form inputs
  const [formData, setFormData] = useState({
    title: '',
    conceptType: 'Theory' as ConceptType,
    explanation: '',
    positionX: 0,
    positionY: 0,
  });

  // Update form data when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      console.log('📋 NodeDetailSidebar: Updating form data for node:', selectedNode.title);
      setFormData({
        title: selectedNode.title || '',
        conceptType: selectedNode.conceptType || 'Theory',
        explanation: selectedNode.explanation || '',
        positionX: selectedNode.position?.x ?? 0,
        positionY: selectedNode.position?.y ?? 0,
      });
    }
  }, [selectedNode]);

  console.log('📋 NodeDetailSidebar render:', {
    selectedNode: selectedNode ? selectedNode.title : 'null',
    isDetailSidebarOpen,
    shouldRender: !(!selectedNode || !isDetailSidebarOpen),
    formTitle: formData.title
  });

  if (!selectedNode || !isDetailSidebarOpen) {
    return null;
  }

  const handleClose = () => {
    setSelectedNodeId(null); // This will automatically close the sidebar via the store
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (selectedNode) {
      updateNode(selectedNode.id, {
        title: formData.title,
        conceptType: formData.conceptType,
        explanation: formData.explanation,
        position: {
          x: formData.positionX,
          y: formData.positionY
        }
      });
      console.log('📋 NodeDetailSidebar: Saved changes for node:', selectedNode.id);
    }
  };

  const handleDelete = () => {
    if (selectedNode && window.confirm(`Are you sure you want to delete "${selectedNode.title}"?`)) {
      // TODO: Implement delete functionality
      console.log('📋 NodeDetailSidebar: Delete requested for node:', selectedNode.id);
    }
  };

  return (
    <div className="node-detail-sidebar">
      <div className="sidebar-header">
        <h3>Node Details</h3>
        <button onClick={handleClose} className="close-button">
          ×
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="detail-section">
          <h4>Basic Information</h4>
          <div className="detail-item">
            <label>ID:</label>
            <span>{selectedNode.id}</span>
          </div>
          <div className="detail-item">
            <label>Label:</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter node label"
            />
          </div>
          <div className="detail-item">
            <label>Type:</label>
            <select 
              value={formData.conceptType}
              onChange={(e) => handleInputChange('conceptType', e.target.value as ConceptType)}
            >
              <option value="Field">Field</option>
              <option value="Theory">Theory</option>
              <option value="Algorithm">Algorithm</option>
              <option value="Tool">Tool</option>
              <option value="Person">Person</option>
            </select>
          </div>
        </div>

        <div className="detail-section">
          <h4>Description</h4>
          <textarea 
            placeholder="Enter node description..."
            value={formData.explanation}
            onChange={(e) => handleInputChange('explanation', e.target.value)}
            rows={4}
          />
        </div>

        <div className="detail-section">
          <h4>Position</h4>
          <div className="position-inputs">
            <div className="detail-item">
              <label>X:</label>
              <input 
                type="number" 
                value={formData.positionX}
                onChange={(e) => handleInputChange('positionX', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="detail-item">
              <label>Y:</label>
              <input 
                type="number" 
                value={formData.positionY}
                onChange={(e) => handleInputChange('positionY', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Actions</h4>
          <div className="action-buttons">
            <button className="action-button save" onClick={handleSave}>
              Save Changes
            </button>
            <button className="action-button delete" onClick={handleDelete}>
              Delete Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailSidebar; 