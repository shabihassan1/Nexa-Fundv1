import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";
import { categories } from "@/data/campaigns";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fetchCampaigns } from "@/services/campaignService";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { fetchRecommendations } from "@/services/recommenderService";

const Browse = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => fetchCampaigns({ status: 'ACTIVE' }) // Only fetch active campaigns for browsing
  });

  // Ensure campaigns is an array before filtering
  const campaigns = Array.isArray(data?.campaigns) ? data?.campaigns : [];
  
  // Recommendations query (only when logged in)
  const { data: recosData, isError: recosError, isLoading: recosLoading } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return null;
      try {
        const result = await fetchRecommendations({ donor_id: user.id, top_k: 50 });
        return result;
      } catch (error) {
        console.warn('⚠️ Recommendation service unavailable:', error);
        return null; // Fallback to showing all campaigns
      }
    },
    enabled: isAuthenticated && !!user?.id,
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Map recommendation order for sorting
  const recommendedOrder = useMemo(() => {
    const order = new Map<string, number>();
    console.log('🔍 Recommendations data:', recosData);
    if (Array.isArray(recosData?.data)) {
      console.log('📊 Recommendations array:', recosData.data);
      recosData.data.forEach((r: any, idx: number) => {
        console.log(`🎯 Recommendation ${idx}:`, r);
        order.set(r.campaign_id, idx);
      });
    }
    console.log('🗺️ Recommended order map:', order);
    return order;
  }, [recosData]);

  // Filter (search/category) then apply recommendation logic
  const filteredCampaigns = useMemo(() => {
    const byFilter = campaigns.filter((campaign) => {
      const matchesCategory = selectedCategory === "All Categories" || campaign.category === selectedCategory;
      const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
      const isActive = campaign.status === 'ACTIVE';
      return matchesCategory && matchesSearch && isActive;
    });

    console.log('🔍 Filtered campaigns:', byFilter.length);
    console.log('👤 Is authenticated:', isAuthenticated);
    console.log('📊 Recommended order size:', recommendedOrder.size);

    if (!isAuthenticated || recommendedOrder.size === 0) {
      console.log('⚠️ No recommendations, showing all campaigns');
      return byFilter;
    }

    // Keep only recommended campaigns (based on user interest)
    const recommendedOnly = byFilter.filter(c => {
      const hasRecommendation = recommendedOrder.has(c.id);
      console.log(`🎯 Campaign ${c.id} (${c.title}) has recommendation:`, hasRecommendation);
      return hasRecommendation;
    });
    
    console.log('✅ Recommended campaigns found:', recommendedOnly.length);
    
    if (recommendedOnly.length === 0) {
      console.log('⚠️ No recommended campaigns match filters, showing all');
      return byFilter; // Fallback if no overlap
    }
    
    // Sort by recommendation rank
    recommendedOnly.sort((a, b) => (recommendedOrder.get(a.id)! - recommendedOrder.get(b.id)!));
    console.log('📋 Final sorted campaigns:', recommendedOnly.map(c => c.title));
    return recommendedOnly;
  }, [campaigns, selectedCategory, searchQuery, isAuthenticated, recommendedOrder]);

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
              {isAuthenticated && recommendedOrder.size > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  🎯 Personalized for you
                </span>
              )}
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/4 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  className="pl-10 h-10"
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
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {renderSkeletons()}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">Error loading campaigns</h3>
                <p className="text-gray-500">Please try again later</p>
              </div>
            ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-medium mb-2">No campaigns found</h3>
                <p className="text-gray-500">Try adjusting your search or browse all categories</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Browse;
