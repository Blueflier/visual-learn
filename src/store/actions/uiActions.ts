import type { UIActions, StoreGet, StoreSet } from '../types';

export const createUIActions = (set: StoreSet, get: StoreGet): UIActions => ({
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
}); 