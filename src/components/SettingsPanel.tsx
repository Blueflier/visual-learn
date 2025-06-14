import { useGraphStore } from '../store/graphStore';
import ProviderSettings from './settings/ProviderSettings';

const SettingsPanel = () => {
  const { isSettingsPanelOpen, toggleSettingsPanel } = useGraphStore();

  if (!isSettingsPanelOpen) return null;

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Settings</h3>
        <button onClick={toggleSettingsPanel} className="close-button">
          ×
        </button>
      </div>
      
      <div className="settings-content">
        <ProviderSettings />

        <div className="setting-group">
          <h4>Graph Layout</h4>
          <label>
            <input type="radio" name="layout" value="hierarchical" />
            Hierarchical
          </label>
          <label>
            <input type="radio" name="layout" value="force" defaultChecked />
            Force-directed
          </label>
          <label>
            <input type="radio" name="layout" value="circular" />
            Circular
          </label>
        </div>

        <div className="setting-group">
          <h4>Visual Options</h4>
          <label>
            <input type="checkbox" defaultChecked />
            Show node labels
          </label>
          <label>
            <input type="checkbox" defaultChecked />
            Show edge labels
          </label>
          <label>
            <input type="checkbox" />
            Show minimap
          </label>
        </div>

        <div className="setting-group">
          <h4>Node Colors</h4>
          <input type="color" defaultValue="#ff6b6b" />
          <span>Default node color</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel; 