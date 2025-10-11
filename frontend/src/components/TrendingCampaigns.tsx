import { useQuery } from '@tanstack/react-query';
import CampaignCard from './CampaignCard';
import { fetchCampaigns } from '@/services/campaignService';
import { Skeleton } from '@/components/ui/skeleton';

const TrendingCampaigns = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trending-campaigns'],
    queryFn: () => fetchCampaigns({ status: 'ACTIVE' }) // Only fetch active campaigns for trending
  });

  // Ensure campaigns is an array before sorting
  const campaigns = Array.isArray(data?.campaigns) ? data?.campaigns : [];

  // Get the top 3 active campaigns by current amount
  const trendingCampaigns = campaigns
    .filter(campaign => campaign.status === 'ACTIVE')
    .sort((a, b) => b.currentAmount - a.currentAmount)
    .slice(0, 3);

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
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
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Trending</span> Now
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            These campaigns are gaining momentum fast. Don't miss your chance to be part of something big!
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {renderSkeletons()}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Failed to load trending campaigns. Please try again later.</p>
          </div>
        ) : trendingCampaigns && trendingCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trendingCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No trending campaigns available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendingCampaigns;
