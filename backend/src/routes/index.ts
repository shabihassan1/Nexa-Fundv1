import { Router } from 'express';
import authRoutes from './auth.routes';
import campaignRoutes from './campaign.routes';
import milestoneRoutes from './milestone.routes';
import rewardTierRoutes from './rewardTier.routes';
import contributionRoutes from './contribution.routes';
import userRoutes from './user.routes';
import updateRoutes from './update.routes';
import recommenderRoutes from './recommender.routes';
import { uploadImage } from '../controllers/upload.controller';

const router = Router();

console.log('🔧 Registering API routes...');

// Register upload route
router.post('/uploads', uploadImage);
console.log('✅ Upload routes registered');

// Register auth routes
router.use('/auth', authRoutes);
console.log('✅ Auth routes registered');

// Register campaign routes
router.use('/campaigns', campaignRoutes);
console.log('✅ Campaign routes registered');

// Register milestone routes
router.use('/milestones', milestoneRoutes);
console.log('✅ Milestone routes registered');

// Register reward tier routes
router.use('/reward-tiers', rewardTierRoutes);
console.log('✅ Reward tier routes registered');

// Register contribution routes
router.use('/contributions', contributionRoutes);
console.log('✅ Contribution routes registered');

// Register user routes
router.use('/users', userRoutes);
console.log('✅ User routes registered');

// Register update routes
router.use('/', updateRoutes);
console.log('✅ Update routes registered');

// Register recommender proxy routes
router.use('/recommender', recommenderRoutes);
console.log('✅ Recommender routes registered');

console.log('🎉 All API routes registered successfully');

export default router; 