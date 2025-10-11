import { Request, Response } from 'express';
/**
 * Reward Tier Controller
 * Handles all reward tier-related operations
 */
export declare const rewardTierController: {
    /**
     * Get all reward tiers for a campaign
     */
    getRewardTiersByCampaign: (req: Request, res: Response) => Promise<void>;
    /**
     * Get a single reward tier by ID
     */
    getRewardTierById: (req: Request, res: Response) => Promise<void>;
    /**
     * Create a new reward tier
     */
    createRewardTier: (req: Request, res: Response) => Promise<void>;
    /**
     * Update an existing reward tier
     */
    updateRewardTier: (req: Request, res: Response) => Promise<void>;
    /**
     * Delete a reward tier
     */
    deleteRewardTier: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=rewardTier.controller.d.ts.map