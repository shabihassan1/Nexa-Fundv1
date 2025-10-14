// recommendationService.ts - Frontend service for personalized recommendations

import { API_URL } from '@/config';

export interface PersonalizedRecommendation {
  campaign_id: string;
  title: string;
  category: string;
  recommendationScore: number;
  badge: 'top_match' | 'recommended' | 'other' | 'trending';
  scores: {
    interest?: number;
    collaborative?: number;
    content?: number;
    trending?: number;
  };
}

export interface AlgorithmInfo {
  algorithms: {
    interest_match: {
      weight: string;
      description: string;
      components: Record<string, string>;
    };
    collaborative_filtering: {
      weight: string;
      description: string;
      technique: string;
    };
    content_similarity: {
      weight: string;
      description: string;
      technique: string;
    };
    trending_boost: {
      weight: string;
      description: string;
      components: Record<string, string>;
    };
  };
  badge_thresholds: {
    top_match: string;
    recommended: string;
    other: string;
  };
  fallback_behavior: Record<string, string>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const recommendationService = {
  /**
   * Get personalized recommendations for authenticated user
   */
  async getPersonalized(top_n: number = 20): Promise<PersonalizedRecommendation[]> {
    const response = await fetch(`${API_URL}/recommendations/personalized?top_n=${top_n}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch personalized recommendations');
    }

    const data = await response.json();
    return data.recommendations || [];
  },

  /**
   * Get trending campaigns (for non-authenticated users)
   */
  async getTrending(top_n: number = 20): Promise<PersonalizedRecommendation[]> {
    const response = await fetch(`${API_URL}/recommendations/trending?top_n=${top_n}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trending recommendations');
    }

    const data = await response.json();
    return data.recommendations || [];
  },

  /**
   * Get algorithm information
   */
  async getAlgorithmInfo(): Promise<AlgorithmInfo> {
    const response = await fetch(`${API_URL}/recommendations/algorithm-info`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch algorithm info');
    }

    return response.json();
  },
};
