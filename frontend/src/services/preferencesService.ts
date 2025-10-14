import { API_URL as BASE_API_URL } from '@/config';

const API_URL = `${BASE_API_URL}/preferences`;

export interface UserPreferences {
  interests: string[];
  fundingPreference: string | null;
  riskTolerance: string | null;
  interestKeywords: string[];
  preferencesSet: boolean;
}

export interface PreferencesCategories {
  categories: string[];
  fundingPreferences: string[];
  riskTolerances: string[];
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const preferencesService = {
  // Get available categories
  async getCategories(): Promise<PreferencesCategories> {
    const response = await fetch(`${API_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Get current user's preferences
  async getMyPreferences(): Promise<UserPreferences> {
    const response = await fetch(`${API_URL}/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch preferences');
    const data = await response.json();
    return data.preferences;
  },

  // Update current user's preferences
  async updateMyPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences),
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    const data = await response.json();
    return data.preferences;
  },

  // Reset preferences to defaults
  async resetMyPreferences(): Promise<UserPreferences> {
    const response = await fetch(`${API_URL}/me`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to reset preferences');
    const data = await response.json();
    return data.preferences;
  },
};
