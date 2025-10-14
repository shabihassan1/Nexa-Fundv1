import { API_URL } from '@/config';

export const getCurrentUser = async (token: string) => {
  const res = await fetch(`${API_URL}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
};

export const updateUser = async (id: string, updateData: any, token: string) => {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
};

export const updateUserWalletAddress = async (id: string, walletAddress: string, token: string) => {
  return updateUser(id, { wallet_address: walletAddress }, token);
};

export const fetchUserById = async (id: string, token: string) => {
  try {
  const res = await fetch(`${API_URL}/users/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
    
    if (!res.ok) {
      if (res.status === 404) {
        console.log(`User with ID ${id} not found, returning default user`);
        // Return a default user object instead of throwing an error
        return {
          id: id,
          name: "Anonymous",
          email: "",
          walletAddress: id // Use the ID as the wallet address since that's likely what we have
        };
      }
      throw new Error('Failed to fetch user');
    }
    
  return res.json();
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    // Return a default user object on error
    return {
      id: id,
      name: "Anonymous",
      email: "",
      walletAddress: id
    };
  }
};

export const fetchMyActivity = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/users/me/activity`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!res.ok) throw new Error('Failed to fetch user activity');
  return res.json();
};

export const fetchUserCampaigns = async (userId: string, token: string) => {
  try {
  const res = await fetch(`${API_URL}/users/${userId}/campaigns`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
    
    if (!res.ok) {
      if (res.status === 404) {
        // If user not found, return empty array
        return [];
      }
      throw new Error('Failed to fetch user campaigns');
    }
    
  return res.json();
  } catch (error) {
    console.error(`Error fetching campaigns for user ${userId}:`, error);
    return [];
  }
};
