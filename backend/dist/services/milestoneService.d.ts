export interface CreateMilestoneData {
    title: string;
    description: string;
    amount: number;
    deadline: Date;
    order: number;
}
export interface SubmitMilestoneData {
    evidence: any;
    description: string;
}
export interface VoteMilestoneData {
    isApproval: boolean;
    comment?: string;
}
export declare class MilestoneService {
    static createMilestones(campaignId: string, milestonesData: CreateMilestoneData[]): Promise<{
        id: string;
        status: import("../generated/prisma").$Enums.MilestoneStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        amount: number;
        campaignId: string;
        order: number;
        deadline: Date;
        submittedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        evidence: import("../generated/prisma/runtime/library").JsonValue | null;
        adminNotes: string | null;
        votesFor: number;
        votesAgainst: number;
        votingDeadline: Date | null;
    }[]>;
    static validateMilestoneRequirements(campaignId: string): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    static submitMilestone(milestoneId: string, userId: string, submissionData: SubmitMilestoneData): Promise<{
        submission: {
            id: string;
            status: import("../generated/prisma").$Enums.SubmissionStatus;
            description: string;
            milestoneId: string;
            submittedAt: Date;
            evidence: import("../generated/prisma/runtime/library").JsonValue;
        };
        milestone: {
            id: string;
            status: import("../generated/prisma").$Enums.MilestoneStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            amount: number;
            campaignId: string;
            order: number;
            deadline: Date;
            submittedAt: Date | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            evidence: import("../generated/prisma/runtime/library").JsonValue | null;
            adminNotes: string | null;
            votesFor: number;
            votesAgainst: number;
            votingDeadline: Date | null;
        };
    }>;
    static startVoting(milestoneId: string): Promise<{
        id: string;
        status: import("../generated/prisma").$Enums.MilestoneStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        amount: number;
        campaignId: string;
        order: number;
        deadline: Date;
        submittedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        evidence: import("../generated/prisma/runtime/library").JsonValue | null;
        adminNotes: string | null;
        votesFor: number;
        votesAgainst: number;
        votingDeadline: Date | null;
    }>;
    static voteOnMilestone(milestoneId: string, userId: string, voteData: VoteMilestoneData): Promise<{
        vote: {
            id: string;
            createdAt: Date;
            userId: string;
            isApproval: boolean;
            comment: string | null;
            votingPower: number;
            milestoneId: string;
        };
        milestone: {
            id: string;
            status: import("../generated/prisma").$Enums.MilestoneStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            amount: number;
            campaignId: string;
            order: number;
            deadline: Date;
            submittedAt: Date | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            evidence: import("../generated/prisma/runtime/library").JsonValue | null;
            adminNotes: string | null;
            votesFor: number;
            votesAgainst: number;
            votingDeadline: Date | null;
        };
    }>;
    static checkMilestoneVotingResult(milestoneId: string): Promise<void>;
    static approveMilestone(milestoneId: string, executedBy: string): Promise<{
        milestone: {
            id: string;
            status: import("../generated/prisma").$Enums.MilestoneStatus;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            amount: number;
            campaignId: string;
            order: number;
            deadline: Date;
            submittedAt: Date | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            evidence: import("../generated/prisma/runtime/library").JsonValue | null;
            adminNotes: string | null;
            votesFor: number;
            votesAgainst: number;
            votingDeadline: Date | null;
        };
        escrowTransaction: {
            id: string;
            status: import("../generated/prisma").$Enums.TransactionStatus;
            createdAt: Date;
            description: string;
            amount: number;
            campaignId: string;
            milestoneId: string | null;
            type: import("../generated/prisma").$Enums.EscrowTransactionType;
            executedBy: string | null;
            executedAt: Date | null;
        };
    }>;
    static rejectMilestone(milestoneId: string, executedBy: string, reason: string): Promise<{
        id: string;
        status: import("../generated/prisma").$Enums.MilestoneStatus;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        amount: number;
        campaignId: string;
        order: number;
        deadline: Date;
        submittedAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        evidence: import("../generated/prisma/runtime/library").JsonValue | null;
        adminNotes: string | null;
        votesFor: number;
        votesAgainst: number;
        votingDeadline: Date | null;
    }>;
    static processContributionToEscrow(contributionId: string): Promise<{
        id: string;
        status: import("../generated/prisma").$Enums.TransactionStatus;
        createdAt: Date;
        description: string;
        amount: number;
        campaignId: string;
        milestoneId: string | null;
        type: import("../generated/prisma").$Enums.EscrowTransactionType;
        executedBy: string | null;
        executedAt: Date | null;
    }>;
    static getMilestoneStats(campaignId: string): Promise<{
        total: number;
        pending: number;
        submitted: number;
        voting: number;
        approved: number;
        rejected: number;
        totalApprovedAmount: number;
    }>;
    static checkExpiredMilestones(): Promise<{
        expiredMilestones: number;
        endedVotingMilestones: number;
    }>;
}
export default MilestoneService;
//# sourceMappingURL=milestoneService.d.ts.map