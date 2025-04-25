import api from './api';

export const settingsService = {
  async getSettings() {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch settings');
    }
  },

  async updateSettings(settings) {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update settings');
    }
  },
}; 