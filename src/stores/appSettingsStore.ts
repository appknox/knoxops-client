import { create } from 'zustand';
import { settingsApi, type AppSettings } from '../api/settings';

interface AppSettingsState {
  settings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Record<string, string>) => Promise<void>;
  testSlackWebhook: (channel: 'onprem' | 'device') => Promise<void>;
  clearError: () => void;
}

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  settings: {},
  isLoading: false,
  isSaving: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await settingsApi.getSettings();
      set({ settings, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to load settings';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateSettings: async (updates) => {
    set({ isSaving: true, error: null });
    try {
      const settings = await settingsApi.updateSettings(updates);
      set({ settings, isSaving: false });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update settings';
      set({ error: message, isSaving: false });
      throw error;
    }
  },

  testSlackWebhook: async (channel) => {
    set({ error: null });
    try {
      await settingsApi.testSlackWebhook(channel);
      // Success message handled in UI
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send test notification';
      set({ error: message });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
