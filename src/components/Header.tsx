import { useAppStore } from '../store/appStore';

const Header = () => {
  const { toggleSettingsPanel, toggleDetailSidebar, selectedNode } = useAppStore();

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Concept Graph Explorer</h1>
      </div>
      
      <div className="header-center">
        <nav className="main-nav">
          <button className="nav-button">New Graph</button>
          <button className="nav-button">Load Graph</button>
          <button className="nav-button">Save Graph</button>
          <button className="nav-button">Export</button>
        </nav>
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
          className={`tool-button ${selectedNode ? 'active' : 'disabled'}`}
          onClick={toggleDetailSidebar}
          disabled={!selectedNode}
          title="Node Details"
        >
          📋
        </button>
      </div>
    </header>
  );
};

export default Header; 