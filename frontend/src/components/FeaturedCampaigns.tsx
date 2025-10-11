import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CampaignCard from './CampaignCard';
import CategoryFilter from './CategoryFilter';
import { fetchCampaigns } from '@/services/campaignService';
import { Skeleton } from '@/components/ui/skeleton';

const FeaturedCampaigns = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-campaigns'],
    queryFn: () => fetchCampaigns({ status: 'ACTIVE' }) // Only fetch active campaigns for featuring
  });

  // Ensure campaigns is an array before sorting
  const campaigns = Array.isArray(data?.campaigns) ? data?.campaigns : [];

  // Get the featured campaigns (could use different criteria - here we're using highest target amount)
  // Additional filter to ensure only active campaigns are featured
  const featuredCampaigns = campaigns
    .filter(campaign => campaign.status === 'ACTIVE')
    .sort((a, b) => b.targetAmount - a.targetAmount)
    .slice(0, 6);

  const filteredCampaigns = selectedCategory === 'all'
    ? featuredCampaigns
    : featuredCampaigns.filter(campaign => 
        campaign.category.toLowerCase() === selectedCategory);

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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Featured</span> Campaigns
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover innovative projects from creators around the world and help bring their ideas to life.
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
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
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
