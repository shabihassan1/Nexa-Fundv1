import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import CampaignCard from './CampaignCard';
import CategoryFilter from './CategoryFilter';
import { fetchCampaigns } from '@/services/campaignService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { recommendationService } from '@/services/recommendationService';
import { Sparkles } from 'lucide-react';

const FeaturedCampaigns = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-campaigns'],
    queryFn: () => fetchCampaigns({ status: 'ACTIVE' })
  });

  // Fetch personalized recommendations for logged-in users
  const { data: personalizedData } = useQuery({
    queryKey: ['homepage-recommendations', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return null;
      try {
        const recommendations = await recommendationService.getPersonalized(6);
        return { recommendations };
      } catch (error) {
        console.warn('⚠️ Homepage recommendations unavailable:', error);
        return null;
      }
    },
    enabled: isAuthenticated && !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const campaigns = Array.isArray(data?.campaigns) ? data?.campaigns : [];

  // Merge campaigns with recommendation scores
  const campaignsWithScores = useMemo(() => {
    if (!personalizedData?.recommendations) {
      return campaigns;
    }

    const scoreMap = new Map(
      personalizedData.recommendations.map((r: any) => [
        r.campaign_id,
        {
          score: r.recommendationScore,
          badge: r.badge,
          scores: r.scores,
        }
      ])
    );

    return campaigns.map(c => ({
      ...c,
      recommendationScore: scoreMap.get(c.id)?.score,
      badge: scoreMap.get(c.id)?.badge,
      scores: scoreMap.get(c.id)?.scores,
    }));
  }, [campaigns, personalizedData]);

  // Get featured campaigns - use personalized if available, otherwise sort by target amount
  const featuredCampaigns = useMemo(() => {
    const activeCampaigns = campaignsWithScores.filter(c => c.status === 'ACTIVE');
    
    if (isAuthenticated && personalizedData?.recommendations) {
      // Sort by recommendation score for logged-in users
      return activeCampaigns
        .sort((a: any, b: any) => (b.recommendationScore || 0) - (a.recommendationScore || 0))
        .slice(0, 6);
    } else {
      // Sort by target amount for logged-out users
      return activeCampaigns
        .sort((a, b) => b.targetAmount - a.targetAmount)
        .slice(0, 6);
    }
  }, [campaignsWithScores, isAuthenticated, personalizedData]);

  const filteredCampaigns = selectedCategory === 'all'
    ? featuredCampaigns
    : featuredCampaigns.filter(campaign => 
        campaign.category === selectedCategory);

  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="w-full h-48 rounded-lg" />
        <Skeleton className="w-2/3 h-4 rounded" />
        <Skeleton className="w-full h-3 rounded" />
        <Skeleton className="w-full h-2 rounded" />
        <div className="flex justify-between">
          <Skeleton className="w-1/4 h-3 rounded" />
          <Skeleton className="w-1/4 h-3 rounded" />
        </div>
      </div>
    ));
  };

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-2">
            {isAuthenticated && personalizedData?.recommendations ? (
              <>
                <Sparkles className="text-green-500" size={32} />
                <span className="gradient-text">For You</span>
              </>
            ) : (
              <span className="gradient-text">Featured</span>
            )}
            <span>Campaigns</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isAuthenticated && personalizedData?.recommendations 
              ? 'Campaigns matching your interests and preferences'
              : 'Discover innovative projects from creators around the world and help bring their ideas to life.'
            }
          </p>
        </div>

        <CategoryFilter onSelectCategory={setSelectedCategory} />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {renderSkeletons()}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Failed to load featured campaigns. Please try again later.</p>
          </div>
        ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map((campaign: any) => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign}
                showRecommendationBadge={isAuthenticated && !!personalizedData?.recommendations}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No campaigns found for this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCampaigns;
