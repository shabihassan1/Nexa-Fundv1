import { API_URL } from '@/config';

export const createReport = async (reportData, token) => {
  const res = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reportData)
  });
  if (!res.ok) throw new Error('Failed to create report');
  return res.json();
};

export const fetchReportsByCampaign = async (campaignId, token) => {
  const res = await fetch(`${API_URL}/campaigns/${campaignId}/reports`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
};

export const updateReportStatus = async (id: string, status: string, token: string) => {
  try {
    const res = await fetch(`${API_URL}/reports/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!res.ok) throw new Error('Failed to update report status');
    return res.json();
  } catch (error) {
    console.error(`Error updating report status with id ${id}:`, error);
    throw error;
  }
};
