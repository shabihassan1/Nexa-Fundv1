import { Router } from 'express';
import { MilestoneController } from '../controllers/milestone.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Individual milestone routes
router.get('/:milestoneId', MilestoneController.getMilestone);
router.put('/:milestoneId', MilestoneController.updateMilestone);
router.post('/:milestoneId/submit', MilestoneController.submitMilestone);
router.post('/:milestoneId/vote', MilestoneController.voteOnMilestone);

// NEW: Voting system routes
router.get('/:milestoneId/voting-stats', MilestoneController.getVotingStats);
router.post('/:milestoneId/submit-for-voting', MilestoneController.submitForVoting);
router.post('/:milestoneId/vote-weighted', MilestoneController.voteWeighted);

// Admin only routes
router.post('/:milestoneId/start-voting', 
  requireRole(['ADMIN', 'SUPER_ADMIN']), 
  MilestoneController.startVoting
);
router.post('/:milestoneId/open-voting', 
  requireRole(['ADMIN', 'SUPER_ADMIN']), 
  MilestoneController.openVoting
);
router.post('/:milestoneId/check-release', 
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  MilestoneController.triggerReleaseCheck
);
router.post('/:milestoneId/approve', 
  requireRole(['ADMIN', 'SUPER_ADMIN']), 
  MilestoneController.approveMilestone
);
router.post('/:milestoneId/reject', 
  requireRole(['ADMIN', 'SUPER_ADMIN']), 
  MilestoneController.rejectMilestone
);

// Admin only - Manual trigger for milestone release cron job
router.post('/admin/trigger-release-check', 
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  MilestoneController.manualReleaseCheck
);

// User voting history
router.get('/votes/my-votes', MilestoneController.getUserVotes);

export default router;
