import { Request, Response } from 'express';
/**
 * Campaign Controller
 * Handles all campaign-related operations
 */
export declare const campaignController: {
    /**
     * Get all campaigns with optional filtering
     */
    getAllCampaigns: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get a single campaign by ID
     */
    getCampaignById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Create a new campaign
     */
    createCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Update an existing campaign
     */
    updateCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Delete a campaign
     */
    deleteCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    /**
     * Get campaign statistics (Admin only)
     */
    getCampaignStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=campaign.controller.d.ts.map