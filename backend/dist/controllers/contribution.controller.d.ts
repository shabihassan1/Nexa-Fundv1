import { Request, Response } from 'express';
/**
 * Contribution Controller
 * Handles all contribution-related operations
 */
export declare const contributionController: {
    /**
     * Get all contributions for a campaign
     */
    getContributionsByCampaign: (req: Request, res: Response) => Promise<void>;
    /**
     * Get all contributions by a user
     */
    getContributionsByUser: (req: Request, res: Response) => Promise<void>;
    /**
     * Create a new contribution
     */
    createContribution: (req: Request, res: Response) => Promise<void>;
    /**
     * Get contribution statistics for a campaign
     */
    getCampaignStats: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=contribution.controller.d.ts.map