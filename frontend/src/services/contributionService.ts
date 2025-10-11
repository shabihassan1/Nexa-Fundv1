import { API_URL } from '@/config';

export const createContribution = async (contributionData: any, token: string) => {
  const res = await fetch(`${API_URL}/contributions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(contributionData)
  });
  if (!res.ok) throw new Error('Failed to create contribution');
  return res.json();
};

export const fetchContributionsByCampaign = async (campaignId: string, token?: string) => {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/contributions`, {
    headers
  });
  if (!res.ok) throw new Error('Failed to fetch contributions');
  return res.json();
};

export const fetchContributionsByUser = async (userId: string, token: string) => {
  const res = await fetch(`${API_URL}/users/${userId}/contributions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch user contributions');
  return res.json();
};

export const fetchCampaignStats = async (campaignId: string, token?: string) => {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/stats`, {
    headers
  });
  if (!res.ok) throw new Error('Failed to fetch campaign stats');
  return res.json();
};
