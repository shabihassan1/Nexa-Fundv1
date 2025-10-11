import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Users } from 'lucide-react';

export interface RewardTier {
  id: string;
  title: string;
  description: string;
  minimumAmount: number;
  _count?: {
    contributions: number;
  };
}

interface RewardTiersProps {
  rewardTiers: RewardTier[];
  onSelectTier?: (tier: RewardTier) => void;
  showSelectButton?: boolean;
  isCreator?: boolean;
}

const RewardTiers: React.FC<RewardTiersProps> = ({ 
  rewardTiers, 
  onSelectTier, 
  showSelectButton = false,
  isCreator = false
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!rewardTiers || rewardTiers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="h-5 w-5 mr-2" />
            Reward Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No reward tiers have been set up for this campaign yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="h-5 w-5 mr-2" />
          Reward Tiers
        </CardTitle>
        <p className="text-sm text-gray-600">
          Support this campaign and get exclusive rewards
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rewardTiers
          .sort((a, b) => a.minimumAmount - b.minimumAmount)
          .map((tier) => (
            <div
              key={tier.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{tier.title}</h4>
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      {formatCurrency(tier.minimumAmount)}+
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {tier.description}
                  </p>
                  
                  {tier._count && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 mr-1" />
                      {tier._count.contributions} backer{tier._count.contributions !== 1 ? 's' : ''}
                      {isCreator && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Creator View
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {showSelectButton && onSelectTier && (
                <Button
                  onClick={() => onSelectTier(tier)}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  Select This Reward
                </Button>
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  );
};

export default RewardTiers; 