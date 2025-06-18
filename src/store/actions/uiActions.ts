import type { UIActions, StoreSet, ContextMenuData } from '../types';

export const createUIActions = (set: StoreSet): UIActions => ({
  toggleSettingsPanel: () => {
    try {
      set(state => ({ isSettingsPanelOpen: !state.isSettingsPanelOpen }));
    } catch (error) {
      console.error('Failed to toggle settings panel:', error);
    }
  },

  toggleDetailSidebar: () => {
    try {
      set(state => ({ isDetailSidebarOpen: !state.isDetailSidebarOpen }));
    } catch (error) {
      console.error('Failed to toggle detail sidebar:', error);
    }
  },

  setDetailSidebarOpen: (open: boolean) => {
    try {
      set({ isDetailSidebarOpen: open });
    } catch (error) {
      console.error('Failed to set detail sidebar state:', error);
    }
  },

  createContextMenu: (data: ContextMenuData) => {
    try {
      console.log('🎯 Creating context menu at:', data);
      set({ contextMenu: data });
    } catch (error) {
      console.error('Failed to create context menu:', error);
    }
  },

  closeContextMenu: () => {
    try {
      set({ contextMenu: null });
    } catch (error) {
      console.error('Failed to close context menu:', error);
    }
  },
}); 