import { API_URL } from '@/config';

export interface RewardTier {
  id: string;
  title: string;
  description: string;
  minimumAmount: number;
  campaignId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contributions: number;
  };
}

export interface CreateRewardTierData {
  campaignId: string;
  title: string;
  description: string;
  minimumAmount: number;
}

export interface UpdateRewardTierData {
  title?: string;
  description?: string;
  minimumAmount?: number;
}

/**
 * Fetch all reward tiers for a campaign
 */
export const fetchRewardTiersByCampaign = async (campaignId: string): Promise<RewardTier[]> => {
  try {
    const response = await fetch(`${API_URL}/reward-tiers/campaign/${campaignId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reward tiers: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reward tiers:', error);
    throw error;
  }
};

/**
 * Fetch a single reward tier by ID
 */
export const fetchRewardTierById = async (id: string): Promise<RewardTier> => {
  try {
    const response = await fetch(`${API_URL}/reward-tiers/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reward tier: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reward tier:', error);
    throw error;
  }
};

/**
 * Create a new reward tier
 */
export const createRewardTier = async (rewardTierData: CreateRewardTierData, token: string): Promise<RewardTier> => {
  try {
    const response = await fetch(`${API_URL}/reward-tiers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(rewardTierData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to create reward tier: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reward tier:', error);
    throw error;
  }
};

/**
 * Update an existing reward tier
 */
export const updateRewardTier = async (id: string, rewardTierData: UpdateRewardTierData, token: string): Promise<RewardTier> => {
  try {
    const response = await fetch(`${API_URL}/reward-tiers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(rewardTierData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update reward tier: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating reward tier:', error);
    throw error;
  }
};

/**
 * Delete a reward tier
 */
export const deleteRewardTier = async (id: string, token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/reward-tiers/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete reward tier: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting reward tier:', error);
    throw error;
  }
}; 