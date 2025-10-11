import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";
import { categories } from "@/data/campaigns";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fetchCampaigns } from "@/services/campaignService";
import { Skeleton } from "@/components/ui/skeleton";

const Browse = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => fetchCampaigns({ status: 'ACTIVE' }) // Only fetch active campaigns for browsing
  });

  // Ensure campaigns is an array before filtering
  const campaigns = Array.isArray(data?.campaigns) ? data?.campaigns : [];

  // Filter campaigns based on selected category and search query
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesCategory = selectedCategory === "All Categories" || campaign.category === selectedCategory;
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         campaign.description.toLowerCase().includes(searchQuery.toLowerCase());
    // Additional check to ensure only active campaigns are shown (defense in depth)
    const isActive = campaign.status === 'ACTIVE';
    return matchesCategory && matchesSearch && isActive;
  });

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
            <p className="text-gray-600 mb-8">Find and support innovative projects that matter to you</p>
            
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
