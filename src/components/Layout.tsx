import Header from './Header';
import MainCanvas from './MainCanvas';
import SettingsPanel from './SettingsPanel';
import NodeDetailSidebar from './NodeDetailSidebar';
import EdgeDetailSidebar from './EdgeDetailSidebar';

const Layout = () => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-content">
        <MainCanvas />
        <SettingsPanel />
        <NodeDetailSidebar />
        <EdgeDetailSidebar />
      </div>
    </div>
  );
};

export default Layout; 