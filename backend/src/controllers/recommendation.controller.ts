// recommendation.controller.ts - Backend controller for weighted recommendations

import { Request, Response } from 'express';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const recommendationController = {
  /**
   * Get personalized campaign recommendations for a user
   * Uses multi-algorithm weighted scoring from ML service
   */
  getPersonalizedRecommendations: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const { top_n = 20 } = req.query;
      
      // Get user preferences from database
      const { prisma } = await import('../config/database');
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          interests: true,
          fundingPreference: true,
          riskTolerance: true,
          interestKeywords: true,
          preferencesSet: true
        }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Call ML service
      try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/personalized`, {
          user_id: userId,
          user_preferences: user.preferencesSet ? {
            interests: user.interests || [],
            fundingPreference: user.fundingPreference,
            riskTolerance: user.riskTolerance,
            interestKeywords: user.interestKeywords || []
          } : null,
          top_n: parseInt(top_n as string)
        }, {
          timeout: 10000 // 10 second timeout
        });
        
        return res.status(200).json({
          recommendations: mlResponse.data,
          user_has_preferences: user.preferencesSet,
          algorithm_info: 'Multi-algorithm weighted scoring (Interest 40%, Collaborative 30%, Content 20%, Trending 10%)'
        });
        
      } catch (mlError: any) {
        console.error('ML service error:', mlError.message);
        
        // Fallback: Return trending campaigns if ML service fails
        const fallbackCampaigns = await prisma.campaign.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            category: true,
            currentAmount: true,
            targetAmount: true,
            _count: {
              select: { contributions: true }
            }
          },
          orderBy: {
            contributions: {
              _count: 'desc'
            }
          },
          take: parseInt(top_n as string)
        });
        
        const formatted = fallbackCampaigns.map(c => ({
          campaign_id: c.id,
          title: c.title,
          category: c.category,
          recommendationScore: 0.5,
          badge: 'other',
          scores: { fallback: 1.0 }
        }));
        
        return res.status(200).json({
          recommendations: formatted,
          user_has_preferences: user.preferencesSet,
          fallback: true,
          message: 'ML service unavailable, showing trending campaigns'
        });
      }
      
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return res.status(500).json({ error: 'Failed to get recommendations' });
    }
  },
  
  /**
   * Get trending campaigns for non-authenticated users
   */
  getTrendingRecommendations: async (req: Request, res: Response) => {
    try {
      const { top_n = 20 } = req.query;
      
      // Try ML service first
      try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/trending`, null, {
          params: { top_n: parseInt(top_n as string) },
          timeout: 5000
        });
        
        return res.status(200).json({
          recommendations: mlResponse.data,
          algorithm: 'trending_boost'
        });
        
      } catch (mlError) {
        console.error('ML service error for trending:', mlError);
        
        // Fallback: Simple database query
        const { prisma } = await import('../config/database');
        const campaigns = await prisma.campaign.findMany({
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            category: true,
            currentAmount: true,
            targetAmount: true,
            endDate: true,
            _count: {
              select: { contributions: true }
            }
          },
          orderBy: {
            contributions: {
              _count: 'desc'
            }
          },
          take: parseInt(top_n as string)
        });
        
        const formatted = campaigns.map(c => ({
          campaign_id: c.id,
          title: c.title,
          category: c.category,
          recommendationScore: Math.min(c._count.contributions / 50, 1.0),
          badge: c._count.contributions >= 30 ? 'trending' : 'other',
          scores: { contributions: c._count.contributions }
        }));
        
        return res.status(200).json({
          recommendations: formatted,
          fallback: true,
          message: 'ML service unavailable, showing popular campaigns'
        });
      }
      
    } catch (error) {
      console.error('Error getting trending recommendations:', error);
      return res.status(500).json({ error: 'Failed to get trending campaigns' });
    }
  },
  
  /**
   * Get algorithm information
   */
  getAlgorithmInfo: async (req: Request, res: Response) => {
    try {
      const mlResponse = await axios.get(`${ML_SERVICE_URL}/algorithm-info`, {
        timeout: 5000
      });
      
      return res.status(200).json(mlResponse.data);
      
    } catch (error) {
      console.error('Error getting algorithm info:', error);
      return res.status(200).json({
        algorithms: {
          interest_match: { weight: '40%' },
          collaborative_filtering: { weight: '30%' },
          content_similarity: { weight: '20%' },
          trending_boost: { weight: '10%' }
        },
        note: 'ML service unavailable for detailed info'
      });
    }
  }
};
