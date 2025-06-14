import { useRef } from 'react';
import { useGraphStore } from '../store/graphStore';

const Header = () => {
  const { 
    toggleSettingsPanel, 
    toggleDetailSidebar, 
    selectedNode, 
    selectedEdge,
    exportToJSON,
    importFromJSON,
    clearGraph,
  } = useGraphStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewGraph = () => {
    if (window.confirm('Are you sure you want to create a new graph? This will clear all current data.')) {
      clearGraph();
    }
  };

  const handleExport = () => {
    try {
      const jsonData = exportToJSON();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `concept-graph-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export graph: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleLoadGraph = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importFromJSON(text);
      
      if (result.success) {
        alert('Graph imported successfully!');
      } else {
        alert('Failed to import graph: ' + result.error);
      }
    } catch (error) {
      alert('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Concept Graph Explorer</h1>
      </div>
      
      <div className="header-center">
        <nav className="main-nav">
          <button className="nav-button" onClick={handleNewGraph}>
            New Graph
          </button>
          <button className="nav-button" onClick={handleLoadGraph}>
            Load Graph
          </button>
          <button className="nav-button" onClick={handleExport}>
            Save Graph
          </button>
          <button className="nav-button" onClick={handleExport}>
            Export
          </button>
        </nav>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      
      <div className="header-right">
        <button 
          className="tool-button"
          onClick={toggleSettingsPanel}
          title="Settings"
        >
          ⚙️
        </button>
        <button 
          className={`tool-button ${selectedNode || selectedEdge ? 'active' : 'disabled'}`}
          onClick={toggleDetailSidebar}
          disabled={!selectedNode && !selectedEdge}
          title={selectedNode ? "Node Details" : selectedEdge ? "Edge Details" : "Details"}
        >
          {selectedNode ? '📋' : selectedEdge ? '🔗' : '📋'}
        </button>
      </div>
    </header>
  );
};

export default Header; 