import { API_URL } from '@/config';

export const createMilestone = async (milestoneData: any, token: string) => {
  const res = await fetch(`${API_URL}/milestones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(milestoneData)
  });
  if (!res.ok) throw new Error('Failed to create milestone');
  return res.json();
};

export const fetchMilestonesByCampaign = async (campaignId: string, token?: string) => {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/milestones`, {
    headers
  });
  if (!res.ok) throw new Error('Failed to fetch milestones');
  return res.json();
};

export const fetchMilestoneById = async (id: string, token?: string) => {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}/milestones/${id}`, {
    headers
  });
  if (!res.ok) throw new Error('Failed to fetch milestone');
  return res.json();
};

export const updateMilestone = async (id: string, updateData: any, token: string) => {
  try {
    const res = await fetch(`${API_URL}/milestones/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    if (!res.ok) throw new Error('Failed to update milestone');
    return res.json();
  } catch (error) {
    console.error(`Error updating milestone with id ${id}:`, error);
    throw error;
  }
};

export const deleteMilestone = async (id: string, token: string) => {
  try {
    const res = await fetch(`${API_URL}/milestones/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to delete milestone');
    return true;
  } catch (error) {
    console.error(`Error deleting milestone with id ${id}:`, error);
    throw error;
  }
};

export const voteOnMilestone = async (milestoneId: string, isApproval: boolean, token: string) => {
  try {
    const res = await fetch(`${API_URL}/milestones/${milestoneId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isApproval })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to vote on milestone');
    }
    
    return res.json();
  } catch (error) {
    console.error(`Error voting on milestone with id ${milestoneId}:`, error);
    throw error;
  }
};
