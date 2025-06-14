import { useEffect } from 'react';
import { useGraphStore } from '../store/graphStore';

const NodeDetailSidebar = () => {
  const { selectedNode, isDetailSidebarOpen, toggleDetailSidebar, setSelectedNodeId } = useGraphStore();

  // Auto-open sidebar when a node is selected
  useEffect(() => {
    if (selectedNode && !isDetailSidebarOpen) {
      toggleDetailSidebar();
    }
  }, [selectedNode, isDetailSidebarOpen, toggleDetailSidebar]);

  if (!selectedNode) return null;

  const handleClose = () => {
    setSelectedNodeId(null);
    if (isDetailSidebarOpen) {
      toggleDetailSidebar();
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
              defaultValue={selectedNode.title}
              placeholder="Enter node label"
            />
          </div>
          <div className="detail-item">
            <label>Type:</label>
            <select defaultValue={selectedNode.conceptType || 'default'}>
              <option value="default">Default</option>
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
            defaultValue={selectedNode.explanation || ''}
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
                defaultValue={selectedNode.position?.x ?? 0}
              />
            </div>
            <div className="detail-item">
              <label>Y:</label>
              <input 
                type="number" 
                defaultValue={selectedNode.position?.y ?? 0}
              />
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Actions</h4>
          <button className="action-button save">Save Changes</button>
          <button className="action-button delete">Delete Node</button>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailSidebar; 