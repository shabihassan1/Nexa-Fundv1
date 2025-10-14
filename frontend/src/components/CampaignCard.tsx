import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import StoredImage from "@/components/ui/StoredImage";
import { TopMatchBadge, RecommendedBadge, TrendingBadge, EndingSoonBadge, BadgeContainer } from "./RecommendationBadge";

// Update the interface to match the backend data structure
interface Campaign {
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
  backers?: number;
  daysLeft?: number;
  creator?: {
    name?: string;
    walletAddress: string;
  };
  _count?: {
    contributions: number;
  };
  // Recommendation data
  recommendationScore?: number;
  badge?: 'top_match' | 'recommended' | 'other' | 'trending';
  scores?: {
    interest?: number;
    collaborative?: number;
    content?: number;
    trending?: number;
  };
}

interface CampaignCardProps {
  campaign: Campaign;
  showRecommendationBadge?: boolean;
}

const CampaignCard = ({ campaign, showRecommendationBadge = false }: CampaignCardProps) => {
  // Calculate progress percentage
  const progress = Math.min(Math.round(((campaign.currentAmount || 0) / (campaign.targetAmount || 1)) * 100), 100);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate days left from endDate
  const calculateDaysLeft = () => {
    if (!campaign.endDate) return 0;
    
    const endDate = new Date(campaign.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Get backers count
  const getBackersCount = () => {
    return campaign._count?.contributions || campaign.backers || 0;
  };

  const daysLeft = calculateDaysLeft();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <Link to={`/campaign/${campaign.id}?from=browse`}>
        <div className="aspect-video relative overflow-hidden">
          <StoredImage 
            storageKey={campaign.imageUrl || ""} 
            alt={campaign.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
            fallbackSrc="/placeholder.svg"
          />
          
          {/* Category badge - top right */}
          <div className="absolute top-2 right-2 bg-white py-1 px-2 rounded-full text-xs font-medium">
            {campaign.category}
          </div>
          
          {/* Recommendation badges - top left */}
          {showRecommendationBadge && (
            <div className="absolute top-2 left-2">
              <BadgeContainer>
                {campaign.badge === 'top_match' && campaign.recommendationScore && (
                  <TopMatchBadge score={campaign.recommendationScore} />
                )}
                {campaign.badge === 'recommended' && campaign.recommendationScore && (
                  <RecommendedBadge score={campaign.recommendationScore} />
                )}
                {campaign.badge === 'trending' && (
                  <TrendingBadge />
                )}
                {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                  <EndingSoonBadge daysLeft={daysLeft} />
                )}
              </BadgeContainer>
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 mb-2">{campaign.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
          
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div 
                className="bg-green-500 rounded-full h-2" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-green-600">{formatCurrency(campaign.currentAmount || 0)}</span>
              <span className="text-gray-500">{progress}% of {formatCurrency(campaign.targetAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Link>
      
      <CardFooter className="p-4 pt-0 flex justify-between text-sm text-gray-500">
        <span>{getBackersCount()} backers</span>
        <span>{daysLeft} days left</span>
      </CardFooter>
    </Card>
  );
};

export default CampaignCard;
