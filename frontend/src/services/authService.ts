import { API_URL as BASE_API_URL } from '@/config';
const API_URL = `${BASE_API_URL}/auth`;

export const signUp = async (email: string, password: string, name: string) => {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) throw new Error('Registration failed');
  return res.json();
};

export const signIn = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
};

export const getProfile = async (token: string) => {
  const res = await fetch(`${API_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
};

export const signOut = async () => {
  // For JWT, sign out is client-side: just remove the token
  localStorage.removeItem('token');
  return true;
};

// Password reset and update would require additional backend endpoints
export const resetPassword = async (email: string) => {
  throw new Error('Not implemented. Please contact support.');
};

export const updatePassword = async (newPassword: string) => {
  throw new Error('Not implemented. Please contact support.');
};

export const updateProfile = async (profileData: any, token: string) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update profile');
  }

  return response.json();
};

export const updateWalletAddress = async (walletAddress: string, token: string) => {
  const response = await fetch(`${API_URL}/wallet-address`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update wallet address');
  }

  return response.json();
};

export const swapWalletAddresses = async (userId1: string, userId2: string, token: string) => {
  const response = await fetch(`${API_URL}/swap-wallets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ userId1, userId2 }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to swap wallet addresses');
  }

  return response.json();
};
