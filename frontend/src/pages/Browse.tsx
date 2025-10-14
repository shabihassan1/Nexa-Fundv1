import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";
import { categories } from "@/data/campaigns";
import { Input } from "@/components/ui/input";
import { Search, Star, Target } from "lucide-react";
import { fetchCampaigns } from "@/services/campaignService";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { recommendationService } from "@/services/recommendationService";
import { PersonalizedWidget, PromptWidget, StatsWidget, TrendingWidget } from "@/components/PersonalizationWidget";
import { fetchMyActivity } from "@/services/userService";

interface CampaignWithRecommendation {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
  targetAmount: number;
  currentAmount: number;
  creatorId: string;
  startDate: string;
  endDate: string;
  status?: string;
  recommendationScore?: number;
  badge?: 'top_match' | 'recommended' | 'other' | 'trending';
  scores?: {
    interest?: number;
    collaborative?: number;
    content?: number;
    trending?: number;
  };
}

const Browse = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth();

  // Fetch all campaigns
  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => fetchCampaigns({ status: 'ACTIVE' }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const campaigns = Array.isArray(data?.campaigns) ? data?.campaigns : [];
  
  // Fetch personalized recommendations (only when logged in)
  const { data: personalizedData, isLoading: recosLoading } = useQuery({
    queryKey: ['personalized-recommendations', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return null;
      try {
        const recommendations = await recommendationService.getPersonalized(20);
        return { recommendations };
      } catch (error) {
        console.warn('⚠️ Recommendation service unavailable:', error);
        return null;
      }
    },
    enabled: isAuthenticated && !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trending campaigns (for non-logged in users or fallback)
  const { data: trendingData } = useQuery({
    queryKey: ['trending-recommendations'],
    queryFn: async () => {
      try {
        const recommendations = await recommendationService.getTrending(10);
        return { recommendations };
      } catch (error) {
        console.warn('⚠️ Trending service unavailable:', error);
        return null;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user activity and preferences
  const { data: userActivityData } = useQuery({
    queryKey: ['user-activity', user?.id],
    queryFn: fetchMyActivity,
    enabled: isAuthenticated && !!user?.id,
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  // Merge campaigns with recommendation scores
  const campaignsWithScores: CampaignWithRecommendation[] = useMemo(() => {
    console.log('🔍 Personalized Data:', personalizedData);
    
    if (!personalizedData?.recommendations) {
      console.log('⚠️ No personalized data, returning plain campaigns');
      return campaigns.map(c => ({ ...c }));
    }

    console.log('✅ Found recommendations:', personalizedData.recommendations.length);

    const scoreMap = new Map<string, {
      score: number;
      badge: 'top_match' | 'recommended' | 'other' | 'trending';
      scores: any;
    }>(
      personalizedData.recommendations.map((r: any) => [
        r.campaign_id,
        {
          score: r.recommendationScore,  // Fixed: use recommendationScore instead of final_score
          badge: r.badge,
          scores: r.scores,
        }
      ])
    );

    const withScores = campaigns.map(c => ({
      ...c,
      recommendationScore: scoreMap.get(c.id)?.score,
      badge: scoreMap.get(c.id)?.badge,
      scores: scoreMap.get(c.id)?.scores,
    }));

    console.log('📊 Campaigns with scores:', withScores.filter(c => c.recommendationScore).length);
    return withScores;
  }, [campaigns, personalizedData]);

  // Filter by search and category
  const filteredCampaigns = useMemo(() => {
    return campaignsWithScores.filter((campaign) => {
      const matchesCategory = selectedCategory === "All Categories" || campaign.category === selectedCategory;
      const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
      const isActive = campaign.status === 'ACTIVE';
      return matchesCategory && matchesSearch && isActive;
    });
  }, [campaignsWithScores, selectedCategory, searchQuery]);

  // Separate campaigns by recommendation score
  // Adjusted thresholds for demo (original: 0.80/0.60, adjusted: 0.35/0.20)
  const topMatches = useMemo(() => {
    const matches = filteredCampaigns
      .filter(c => c.recommendationScore && c.recommendationScore >= 0.35)
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
    console.log('⭐ Top Matches:', matches.length, matches.map(c => ({ title: c.title, score: c.recommendationScore })));
    return matches;
  }, [filteredCampaigns]);

  const recommended = useMemo(() => {
    const recs = filteredCampaigns
      .filter(c => c.recommendationScore && c.recommendationScore >= 0.20 && c.recommendationScore < 0.35)
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
    console.log('🎯 Recommended:', recs.length, recs.map(c => ({ title: c.title, score: c.recommendationScore })));
    return recs;
  }, [filteredCampaigns]);

  const others = useMemo(() => {
    const rest = filteredCampaigns.filter(c => !c.recommendationScore || c.recommendationScore < 0.20);
    console.log('📋 Others:', rest.length);
    return rest;
  }, [filteredCampaigns]);

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="py-8 bg-gray-50">
          <div className="container">
            <h1 className="text-3xl font-bold mb-2">Discover Campaigns</h1>
            <p className="text-gray-600 mb-8">
              Find and support innovative projects that matter to you
              {isAuthenticated && topMatches.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🎯 Personalized for you
                </span>
              )}
            </p>
            
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/4 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  className="pl-10 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`px-4 py-2 rounded-full text-sm ${
                      selectedCategory === category
                        ? "bg-green-500 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Main Content + Sidebar Layout */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Content */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderSkeletons()}
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-medium mb-2">Error loading campaigns</h3>
                    <p className="text-gray-500">Please try again later</p>
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-medium mb-2">No campaigns found</h3>
                    <p className="text-gray-500">Try adjusting your search or browse all categories</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Top Matches Section */}
                    {isAuthenticated && topMatches.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="text-yellow-500" size={24} />
                          <h2 className="text-2xl font-bold">Top Matches ({topMatches.length})</h2>
                        </div>
                        <p className="text-gray-600 mb-4">Campaigns perfectly aligned with your interests</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {topMatches.map((campaign) => (
                            <CampaignCard 
                              key={campaign.id} 
                              campaign={campaign} 
                              showRecommendationBadge={true}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Recommended Section */}
                    {isAuthenticated && recommended.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="text-blue-500" size={24} />
                          <h2 className="text-2xl font-bold">Recommended for You ({recommended.length})</h2>
                        </div>
                        <p className="text-gray-600 mb-4">Campaigns that match your preferences</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {recommended.map((campaign) => (
                            <CampaignCard 
                              key={campaign.id} 
                              campaign={campaign} 
                              showRecommendationBadge={true}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Other Campaigns Section */}
                    {others.length > 0 && (
                      <section>
                        <div className="border-t pt-8">
                          <h2 className="text-2xl font-bold mb-4">
                            {isAuthenticated && (topMatches.length > 0 || recommended.length > 0) 
                              ? `Other Campaigns (${others.length})` 
                              : `All Campaigns (${others.length})`}
                          </h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {others.map((campaign) => (
                              <CampaignCard key={campaign.id} campaign={campaign} />
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Fallback when no sections have campaigns */}
                    {!isAuthenticated && filteredCampaigns.length > 0 && topMatches.length === 0 && recommended.length === 0 && others.length === 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCampaigns.map((campaign) => (
                          <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <aside className="w-full lg:w-80 space-y-6">
                {isAuthenticated ? (
                  <>
                    {/* Show personalized widget if user has preferences set */}
                    {userActivityData?.preferences?.preferencesSet ? (
                      <PersonalizedWidget 
                        interests={userActivityData?.preferences?.interests || []}
                        fundingPreference={userActivityData?.preferences?.fundingPreference}
                        riskTolerance={userActivityData?.preferences?.riskTolerance}
                      />
                    ) : (
                      <PromptWidget />
                    )}
                    <StatsWidget
                      backedCount={userActivityData?.activity?.backedCount || 0}
                      totalContributed={userActivityData?.activity?.totalContributed || 0}
                      viewedCount={userActivityData?.activity?.viewedCount || 0}
                      savedCount={userActivityData?.activity?.savedCount || 0}
                    />
                  </>
                ) : (
                  <TrendingWidget />
                )}
              </aside>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Browse;
