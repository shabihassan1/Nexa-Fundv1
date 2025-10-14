import { Request, Response } from 'express';
import { recommenderService } from '../services/recommenderService';
import { prisma } from '../config/database';

export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await recommenderService.getStatus();
    res.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ ok: false, error: message });
  }
};

export const listDonors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await recommenderService.listDonors();
    res.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ ok: false, error: message });
  }
};

export const listCampaigns = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await recommenderService.listCampaigns();
    res.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ ok: false, error: message });
  }
};

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { donor_id, top_k } = req.body || {};
    if (!donor_id) {
      res.status(400).json({ ok: false, error: 'donor_id is required' });
      return;
    }
    const data = await recommenderService.getRecommendations({ donor_id, top_k });
    res.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ ok: false, error: message });
  }
};

export const getSimilarDonors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { donor_id, n_neighbors } = req.body || {};
    if (!donor_id) {
      res.status(400).json({ ok: false, error: 'donor_id is required' });
      return;
    }
    const data = await recommenderService.getSimilarDonors({ donor_id, n_neighbors });
    res.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ ok: false, error: message });
  }
};

// Export endpoints for the Python recommender to fetch real data
export const exportDonors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const donors = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        walletAddress: true,
        email: true,
        name: true,
        bio: true,
        isVerified: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ donors, count: donors.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
};

export const exportCampaigns = async (_req: Request, res: Response): Promise<void> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        title: true,
        description: true,
        story: true,
        additionalMedia: true,
        imageUrl: true,
        targetAmount: true,
        currentAmount: true,
        escrowAmount: true,
        releasedAmount: true,
        category: true,
        status: true,
        riskScore: true,
        isFraudulent: true,
        requiresMilestones: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contributions: true,
            milestones: true,
            rewardTiers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ campaigns, count: campaigns.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
};

export const exportInteractions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const interactions = await prisma.contribution.groupBy({
      by: ['userId', 'campaignId'],
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    const formattedInteractions = interactions.map(interaction => ({
      userId: interaction.userId,
      campaignId: interaction.campaignId,
      weight: interaction._sum.amount || 0,
      contributionCount: interaction._count.id
    }));
    
    res.json({ interactions: formattedInteractions, count: formattedInteractions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
};

export const refreshRecommendations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await recommenderService.refreshRecommendations();
    res.json({ ok: true, data, message: 'Recommendations refreshed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ ok: false, error: message });
  }
};
