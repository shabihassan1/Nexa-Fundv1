// @ts-nocheck
import express from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { contributionController } from '../controllers/contribution.controller';
import { MilestoneController } from '../controllers/milestone.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns with optional filtering
 * @access  Public
 */
router.get('/', campaignController.getAllCampaigns);

/**
 * @route   GET /api/campaigns/stats
 * @desc    Get campaign statistics
 * @access  Private (Admin only)
 */
router.get('/stats', authMiddleware, campaignController.getCampaignStats);

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get a single campaign by ID
 * @access  Public
 */
router.get('/:id', campaignController.getCampaignById);

/**
 * @route   GET /api/campaigns/:id/active-milestone
 * @desc    Get the currently active milestone for a campaign
 * @access  Public
 */
router.get('/:id/active-milestone', campaignController.getActiveMilestone);

/**
 * @route   GET /api/campaigns/:id/contributions
 * @desc    Get all contributions for a campaign
 * @access  Public
 */
router.get('/:id/contributions', (req, res) => {
  req.params.campaignId = req.params.id;
  contributionController.getContributionsByCampaign(req, res);
});

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post('/', authMiddleware, campaignController.createCampaign);

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update an existing campaign
 * @access  Private (creator or admin only)
 */
router.put('/:id', authMiddleware, campaignController.updateCampaign);

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete a campaign
 * @access  Private (creator or admin only)
 */
router.delete('/:id', authMiddleware, campaignController.deleteCampaign);

// Campaign milestone routes
/**
 * @route   POST /api/campaigns/:id/milestones
 * @desc    Create milestones for a campaign
 * @access  Private (creator only)
 */
router.post('/:id/milestones', authMiddleware, (req, res) => {
  req.params.campaignId = req.params.id;
  MilestoneController.createMilestones(req, res);
});

/**
 * @route   GET /api/campaigns/:id/milestones
 * @desc    Get milestones for a campaign
 * @access  Public
 */
router.get('/:id/milestones', (req, res) => {
  req.params.campaignId = req.params.id;
  MilestoneController.getMilestones(req, res);
});

/**
 * @route   GET /api/campaigns/:id/milestones/stats
 * @desc    Get milestone statistics for a campaign
 * @access  Public
 */
router.get('/:id/milestones/stats', (req, res) => {
  req.params.campaignId = req.params.id;
  MilestoneController.getMilestoneStats(req, res);
});

/**
 * @route   GET /api/campaigns/:id/rewards
 * @desc    Get reward tiers for a campaign
 * @access  Public
 */
router.get('/:id/rewards', async (req, res) => {
  try {
    const { id } = req.params;
    const { prisma } = await import('../config/database');
    
    const rewardTiers = await prisma.rewardTier.findMany({
      where: { campaignId: id },
      select: {
        id: true,
        title: true,
        description: true,
        minimumAmount: true,
        createdAt: true,
        _count: {
          select: {
            contributions: true
          }
        }
      },
      orderBy: { minimumAmount: 'asc' }
    });
    
    res.json(rewardTiers);
  } catch (error) {
    console.error('Error fetching reward tiers:', error);
    res.status(500).json({ error: 'Failed to fetch reward tiers' });
  }
});

/**
 * @route   GET /api/campaigns/:id/milestones/validate
 * @desc    Validate milestone requirements for a campaign
 * @access  Private (creator only)
 */
router.get('/:id/milestones/validate', authMiddleware, (req, res) => {
  req.params.campaignId = req.params.id;
  MilestoneController.validateRequirements(req, res);
});

/**
 * @route   GET /api/campaigns/:id/escrow
 * @desc    Get escrow transactions for a campaign
 * @access  Private (creator only)
 */
router.get('/:id/escrow', authMiddleware, (req, res) => {
  req.params.campaignId = req.params.id;
  MilestoneController.getEscrowTransactions(req, res);
});

export default router; 