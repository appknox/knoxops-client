import { apiClient } from './client.js';

export interface AppSettings {
  [key: string]: string;
}

export const settingsApi = {
  /**
   * Fetch all app settings
   */
  async getSettings(): Promise<AppSettings> {
    const response = await apiClient.get('/settings/app');
    return response.data.data;
  },

  /**
   * Update multiple settings at once
   */
  async updateSettings(settings: Record<string, string>): Promise<AppSettings> {
    const response = await apiClient.patch('/settings/app', settings);
    return response.data.data;
  },

  /**
   * Test Slack webhook
   */
  async testSlackWebhook(channel: 'onprem' | 'device' = 'onprem'): Promise<{ message: string }> {
    const response = await apiClient.post('/settings/app/test-slack', {}, {
      params: { channel },
    });
    return response.data;
  },
};
