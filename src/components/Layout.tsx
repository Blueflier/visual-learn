import { ReactFlowProvider } from '@xyflow/react';
import Header from './Header';
import MainCanvas from './MainCanvas';
import SettingsPanel from './SettingsPanel';
import NodeDetailSidebar from './NodeDetailSidebar';
import EdgeDetailSidebar from './EdgeDetailSidebar';
import ContextMenu from './ContextMenu';

const Layout = () => {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-content">
        <ReactFlowProvider>
          <MainCanvas />
        </ReactFlowProvider>
        <SettingsPanel />
        <NodeDetailSidebar />
        <EdgeDetailSidebar />
        <ContextMenu />
      </div>
    </div>
  );
};

export default Layout; 