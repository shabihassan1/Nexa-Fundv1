import { API_URL } from '../config';

const BASE = `${API_URL}/recommender`;

export interface RecommendationRequest {
  donor_id: string;
  top_k?: number;
}

export interface SimilarDonorsRequest {
  donor_id: string;
  n_neighbors?: number;
}

export async function getRecommenderStatus() {
  const res = await fetch(`${BASE}/status`);
  if (!res.ok) throw new Error('Failed to get recommender status');
  return res.json();
}

export async function fetchRecommendations(payload: RecommendationRequest) {
  const res = await fetch(`${BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function fetchSimilarDonors(payload: SimilarDonorsRequest) {
  const res = await fetch(`${BASE}/similar-donors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to fetch similar donors');
  return res.json();
}
