import { Router } from 'express';
import { getRecommendations, getSimilarDonors, getStatus, listCampaigns, listDonors, exportDonors, exportCampaigns, exportInteractions, refreshRecommendations } from '../controllers/recommender.controller';

const router = Router();

router.get('/status', getStatus);
router.get('/donors', listDonors);
router.get('/campaigns', listCampaigns);
router.post('/recommendations', getRecommendations);
router.post('/similar-donors', getSimilarDonors);
router.post('/refresh', refreshRecommendations);

// Export endpoints for Python recommender to fetch real DB data
router.get('/export/donors', exportDonors);
router.get('/export/campaigns', exportCampaigns);
router.get('/export/interactions', exportInteractions);

export default router;
