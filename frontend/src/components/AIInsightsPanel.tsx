import { useState } from "react";
import { Sparkles, Target, TrendingUp, Users, Clock, Award, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Campaign {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  endDate: string;
  creatorId: string;
  creator?: {
    name?: string;
    walletAddress: string;
  };
  _count?: {
    contributions: number;
  };
  recommendationScore?: number;
  badge?: 'top_match' | 'recommended' | 'other' | 'trending';
  scores?: {
    interest?: number;
    collaborative?: number;
    content?: number;
    trending?: number;
  };
}

interface AIInsightsBadgeProps {
  campaign: Campaign;
}

const AIInsightsBadge = ({ campaign }: AIInsightsBadgeProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only show if we have recommendation data
  if (!campaign.recommendationScore && !campaign.scores) {
    return null;
  }

  const matchScore = Math.round((campaign.recommendationScore || 0) * 100);
  const fundingProgress = Math.min(Math.round(((campaign.currentAmount || 0) / (campaign.targetAmount || 1)) * 100), 100);
  const backerCount = campaign._count?.contributions || 0;
  
  // Calculate days remaining
  const daysRemaining = () => {
    if (!campaign.endDate) return 0;
    const endDate = new Date(campaign.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  const daysLeft = daysRemaining();

  // Calculate success probability based on multiple factors
  const calculateSuccessProbability = () => {
    let probability = 0;
    
    // Factor 1: Current funding progress (40% weight)
    probability += Math.min(fundingProgress / 100, 1) * 40;
    
    // Factor 2: Backer momentum (30% weight)
    // Assuming good momentum is 1+ backer per 10% of goal
    const expectedBackers = (campaign.targetAmount / 100) / 10; // rough estimate
    const backerRatio = Math.min(backerCount / Math.max(expectedBackers, 1), 1);
    probability += backerRatio * 30;
    
    // Factor 3: Time remaining vs progress (20% weight)
    // Good if funding % >= time elapsed %
    const totalDuration = 60; // assuming 60 day campaigns
    const timeElapsed = totalDuration - daysLeft;
    const timeElapsedPercent = timeElapsed / totalDuration;
    const fundingProgressDecimal = fundingProgress / 100;
    if (fundingProgressDecimal >= timeElapsedPercent) {
      probability += 20;
    } else {
      probability += (fundingProgressDecimal / timeElapsedPercent) * 20;
    }
    
    // Factor 4: Community strength (10% weight)
    if (backerCount >= 50) probability += 10;
    else if (backerCount >= 20) probability += 7;
    else if (backerCount >= 5) probability += 4;
    
    return Math.min(Math.round(probability), 95); // Cap at 95%
  };

  const successProbability = calculateSuccessProbability();
  
  // Get success level
  const getSuccessLevel = () => {
    if (successProbability >= 75) return { label: "Very High", color: "text-green-600", bg: "bg-green-100" };
    if (successProbability >= 60) return { label: "High", color: "text-blue-600", bg: "bg-blue-100" };
    if (successProbability >= 40) return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Building", color: "text-gray-600", bg: "bg-gray-100" };
  };

  const successLevel = getSuccessLevel();

  // Get community strength
  const getCommunityStrength = () => {
    if (backerCount >= 50) return { label: "Strong", emoji: "🔥", color: "text-orange-600" };
    if (backerCount >= 20) return { label: "Growing", emoji: "📈", color: "text-blue-600" };
    if (backerCount >= 5) return { label: "Building", emoji: "🌱", color: "text-green-600" };
    return { label: "New", emoji: "✨", color: "text-gray-600" };
  };

  const communityStrength = getCommunityStrength();

  // Get urgency level
  const getUrgency = () => {
    if (daysLeft <= 3) return { label: "Final Hours", color: "text-red-600", bg: "bg-red-100", show: true };
    if (daysLeft <= 7) return { label: "Ending Soon", color: "text-orange-600", bg: "bg-orange-100", show: true };
    if (daysLeft <= 14) return { label: "2 Weeks Left", color: "text-yellow-600", bg: "bg-yellow-100", show: true };
    return { label: `${daysLeft} days left`, color: "text-gray-600", bg: "bg-gray-100", show: false };
  };

  const urgency = getUrgency();

  // Parse category breakdown from scores
  const getCategoryBreakdown = () => {
    if (!campaign.scores) return null;
    
    const breakdown: { name: string; percentage: number }[] = [];
    
    if (campaign.scores.interest) {
      breakdown.push({ name: campaign.category, percentage: Math.round(campaign.scores.interest * 100) });
    }
    
    return breakdown.length > 0 ? breakdown : null;
  };

  const categoryBreakdown = getCategoryBreakdown();

  // Get why recommended reasons
  const getRecommendationReasons = () => {
    const reasons: string[] = [];
    
    if (campaign.scores?.interest && campaign.scores.interest > 0.3) {
      reasons.push(`Matches your ${campaign.category} interest`);
    }
    
    if (campaign.scores?.collaborative && campaign.scores.collaborative > 0.2) {
      reasons.push("Similar backers supported this");
    }
    
    if (campaign.scores?.content && campaign.scores.content > 0.2) {
      reasons.push("Content aligns with your preferences");
    }
    
    if (successProbability >= 70) {
      reasons.push("High success indicators");
    }
    
    if (backerCount >= 20) {
      reasons.push("Strong community engagement");
    }
    
    if (urgency.show) {
      reasons.push("Time-sensitive opportunity");
    }

    if (reasons.length === 0) {
      reasons.push("Trending in your area of interest");
    }
    
    return reasons;
  };

  const reasons = getRecommendationReasons();

  return (
    <>
      {/* Compact Badge - Always visible */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-sm hover:shadow-md transition-all hover:scale-105"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {matchScore}% AI Match
      </button>

      {/* Modal with full insights - using modal prop to block pointer events */}
      <Dialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        modal={true}
      >
        <DialogContent 
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Recommendation Insights
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4" onClick={(e) => e.stopPropagation()}>
            {/* Campaign Title */}
            <div className="pb-3 border-b">
              <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
              <p className="text-sm text-gray-500">{campaign.category}</p>
            </div>

            {/* Match Score */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Overall Match</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{matchScore}%</span>
              </div>
              {categoryBreakdown && categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">{cat.name}</span>
                  <span className="text-gray-700 font-medium">{cat.percentage}%</span>
                </div>
              ))}
            </div>

            {/* Success Indicators */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Success Indicators</span>
              </div>
              <div className="space-y-2 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Probability</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${successLevel.bg} ${successLevel.color}`}>
                    {successLevel.label} ({successProbability}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Funding Progress</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${fundingProgress}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-green-600">{fundingProgress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Strength */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">Community Strength</span>
              </div>
              <div className="pl-6">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-600">{backerCount} active backers</span>
                  <span className={`text-sm font-medium ${communityStrength.color}`}>
                    {communityStrength.emoji} {communityStrength.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Urgency */}
            {urgency.show && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-gray-700">Urgency</span>
                </div>
                <div className="pl-6">
                  <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full ${urgency.bg} ${urgency.color}`}>
                    ⚡ {urgency.label}
                  </span>
                </div>
              </div>
            )}

            {/* Why Recommended */}
            <div className="space-y-3 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-gray-700">Why Recommended?</span>
              </div>
              <div className="space-y-1.5">
                {reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5 text-sm">✓</span>
                    <span className="text-sm text-gray-700">{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close button */}
            <Button 
              onClick={() => setIsOpen(false)} 
              className="w-full"
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIInsightsBadge;
