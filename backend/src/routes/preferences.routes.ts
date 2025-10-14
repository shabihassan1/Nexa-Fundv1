import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Interest categories available for selection
// NOTE: These should match the campaign categories in the database
export const INTEREST_CATEGORIES = [
  'Education',
  'Health & Fitness',
  'Technology',
  'Environment',
  'Arts',
  'Community',
  'Emergency Relief',
  'Animal Welfare',
] as const;

// GET /api/preferences/categories - Get available interest categories
router.get('/categories', (req: Request, res: Response) => {
  res.json({
    categories: INTEREST_CATEGORIES,
    fundingPreferences: ['small', 'medium', 'large'],
    riskTolerances: ['low', 'medium', 'high'],
  });
});

// GET /api/preferences/me - Get current user's preferences
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        interests: true,
        fundingPreference: true,
        riskTolerance: true,
        interestKeywords: true,
        preferencesSet: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      preferences: user,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// PUT /api/preferences/me - Update current user's preferences
router.put('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      interests,
      fundingPreference,
      riskTolerance,
      interestKeywords,
    } = req.body;

    // Validate interests
    if (interests && Array.isArray(interests)) {
      const invalidCategories = interests.filter(
        (cat: string) => !INTEREST_CATEGORIES.includes(cat as any)
      );
      if (invalidCategories.length > 0) {
        return res.status(400).json({
          error: 'Invalid interest categories',
          invalidCategories,
        });
      }
    }

    // Validate funding preference
    if (fundingPreference && !['small', 'medium', 'large'].includes(fundingPreference)) {
      return res.status(400).json({ error: 'Invalid funding preference' });
    }

    // Validate risk tolerance
    if (riskTolerance && !['low', 'medium', 'high'].includes(riskTolerance)) {
      return res.status(400).json({ error: 'Invalid risk tolerance' });
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        interests: interests || [],
        fundingPreference: fundingPreference || null,
        riskTolerance: riskTolerance || null,
        interestKeywords: interestKeywords || [],
        preferencesSet: true, // Mark as set once user saves
      },
      select: {
        interests: true,
        fundingPreference: true,
        riskTolerance: true,
        interestKeywords: true,
        preferencesSet: true,
      },
    });

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// DELETE /api/preferences/me - Reset preferences to defaults
router.delete('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        interests: [],
        fundingPreference: null,
        riskTolerance: null,
        interestKeywords: [],
        preferencesSet: false,
      },
      select: {
        interests: true,
        fundingPreference: true,
        riskTolerance: true,
        interestKeywords: true,
        preferencesSet: true,
      },
    });

    res.json({
      message: 'Preferences reset successfully',
      preferences: updatedUser,
    });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

export default router;
