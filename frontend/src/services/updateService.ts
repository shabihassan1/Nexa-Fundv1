import { API_URL } from '@/config';

export interface Update {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  campaignId: string;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    walletAddress: string;
  };
}

export const fetchUpdatesByCampaign = async (campaignId: string): Promise<Update[]> => {
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/updates`);
  if (!res.ok) throw new Error('Failed to fetch updates');
  return res.json();
};

export const fetchUpdateById = async (updateId: string): Promise<Update> => {
  const res = await fetch(`${API_URL}/updates/${updateId}`);
  if (!res.ok) throw new Error('Failed to fetch update');
  return res.json();
};

export const createUpdate = async (updateData: {
  campaignId: string;
  title: string;
  content: string;
  imageUrl?: string;
}, token: string): Promise<Update> => {
  const res = await fetch(`${API_URL}/updates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create update');
  }
  return res.json();
};

export const updateUpdate = async (updateId: string, updateData: {
  title?: string;
  content?: string;
  imageUrl?: string;
}, token: string): Promise<Update> => {
  const res = await fetch(`${API_URL}/updates/${updateId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update update');
  }
  return res.json();
};

export const deleteUpdate = async (updateId: string, token: string): Promise<void> => {
  const res = await fetch(`${API_URL}/updates/${updateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete update');
  }
}; 