import { Request, Response } from 'express';
import { UserRole } from '../generated/prisma';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                walletAddress?: string;
                role: UserRole;
                status: string;
                isVerified: boolean;
            };
        }
    }
}
export declare class MilestoneController {
    static createMilestones(req: Request, res: Response): Promise<void>;
    static getMilestones(req: Request, res: Response): Promise<void>;
    static getMilestone(req: Request, res: Response): Promise<void>;
    static submitMilestone(req: Request, res: Response): Promise<void>;
    static startVoting(req: Request, res: Response): Promise<void>;
    static voteOnMilestone(req: Request, res: Response): Promise<void>;
    static approveMilestone(req: Request, res: Response): Promise<void>;
    static rejectMilestone(req: Request, res: Response): Promise<void>;
    static validateRequirements(req: Request, res: Response): Promise<void>;
    static getMilestoneStats(req: Request, res: Response): Promise<void>;
    static getUserVotes(req: Request, res: Response): Promise<void>;
    static getEscrowTransactions(req: Request, res: Response): Promise<void>;
    static updateMilestone(req: Request, res: Response): Promise<void>;
}
export default MilestoneController;
//# sourceMappingURL=milestone.controller.d.ts.map