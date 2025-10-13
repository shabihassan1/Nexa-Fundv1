import { config } from '../config/env';

export interface RecommendationRequest {
  donor_id: string;
  top_k?: number;
}

export interface SimilarDonorsRequest {
  donor_id: string;
  n_neighbors?: number;
}

export class RecommenderService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = config.recommenderUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getStatus(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/status`);
    if (!response.ok) {
      throw new Error(`Recommender status error: ${response.statusText}`);
    }
    return response.json();
  }

  async listDonors(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/donors`);
    if (!response.ok) {
      throw new Error(`Recommender donors error: ${response.statusText}`);
    }
    return response.json();
  }

  async listCampaigns(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/campaigns`);
    if (!response.ok) {
      throw new Error(`Recommender campaigns error: ${response.statusText}`);
    }
    return response.json();
  }

  async getRecommendations(body: RecommendationRequest): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Recommender recommendations error: ${response.status} ${text}`);
    }
    return response.json();
  }

  async getSimilarDonors(body: SimilarDonorsRequest): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/similar-donors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Recommender similar donors error: ${response.status} ${text}`);
    }
    return response.json();
  }

  async refreshRecommendations(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Recommender refresh error: ${response.status} ${text}`);
    }
    return response.json();
  }
}

export const recommenderService = new RecommenderService();
