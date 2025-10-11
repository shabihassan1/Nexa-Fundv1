import { API_URL, API_BASE_URL } from "@/config";

export const fetchCampaigns = async (params?: { creatorId?: string; status?: string; category?: string; limit?: number; page?: number }) => {
  let url = `${API_URL}/campaigns`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.creatorId) searchParams.append('creatorId', params.creatorId);
    if (params.status) searchParams.append('status', params.status);
    if (params.category) searchParams.append('category', params.category);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
};

export const fetchCampaignById = async (id: string) => {
  const res = await fetch(`${API_URL}/campaigns/${id}`);
  if (!res.ok) throw new Error('Failed to fetch campaign');
  
  const data = await res.json();
  
  // Process additionalMedia if it exists and is a string
  if (data.additionalMedia) {
    if (typeof data.additionalMedia === 'string') {
      try {
        data.additionalMedia = JSON.parse(data.additionalMedia);
      } catch (e) {
        console.error("Error parsing additionalMedia:", e);
        data.additionalMedia = [];
      }
    } else if (!Array.isArray(data.additionalMedia)) {
      data.additionalMedia = [];
    }
  } else {
    data.additionalMedia = [];
  }

  // Normalize imageUrl and additionalMedia URLs
  // Create API_BASE by stripping '/api' from API_URL
  const API_BASE = API_BASE_URL;

  // Normalize main image URL
  if (data.imageUrl) {
    let url = data.imageUrl;
    // Extract path starting at '/uploads'
    const idx = url.indexOf('/uploads/');
    const path = idx >= 0 ? url.slice(idx) : url;
    data.imageUrl = path.startsWith('http') ? path : `${API_BASE}${path}`;
  }

  // Normalize additionalMedia URLs
  data.additionalMedia = data.additionalMedia.map((media: string) => {
    let url = media;
    const idx = url.indexOf('/uploads/');
    const path = idx >= 0 ? url.slice(idx) : url;
    return path.startsWith('http') ? path : `${API_BASE}${path}`;
  });
  
  return data;
};

export const createCampaign = async (campaignData: any, token: string) => {
  // Ensure additionalMedia is properly formatted for API
  if (campaignData.additionalMedia && Array.isArray(campaignData.additionalMedia)) {
    // Some APIs expect additionalMedia as a JSON string
    // campaignData.additionalMedia = JSON.stringify(campaignData.additionalMedia);
  }
  
  const res = await fetch(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(campaignData)
  });
  if (!res.ok) throw new Error('Failed to create campaign');
  return res.json();
};

export const updateCampaign = async (id: string, updateData: any, token: string) => {
  // Ensure additionalMedia is properly formatted for API
  if (updateData.additionalMedia && Array.isArray(updateData.additionalMedia)) {
    // Some APIs expect additionalMedia as a JSON string
    // updateData.additionalMedia = JSON.stringify(updateData.additionalMedia);
  }
  
  const res = await fetch(`${API_URL}/campaigns/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) throw new Error('Failed to update campaign');
  return res.json();
};

export const deleteCampaign = async (id: string, token: string) => {
  const res = await fetch(`${API_URL}/campaigns/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete campaign');
  return true;
};
