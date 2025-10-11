import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Calendar, Heart, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchContributionsByCampaign } from '@/services/contributionService';
import { useAuth } from '@/contexts/AuthContext';

interface Contribution {
  id: string;
  amount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    walletAddress: string;
  };
  rewardTier?: {
    id: string;
    title: string;
    description: string;
    minimumAmount: number;
  };
}

interface BackersSectionProps {
  campaignId: string;
  isCreator: boolean;
}

const BackersSection: React.FC<BackersSectionProps> = ({ campaignId, isCreator }) => {
  const { token } = useAuth();

  // Fetch contributions (backers)
  const { data: contributions = [], isLoading, error } = useQuery({
    queryKey: ['contributions', campaignId],
    queryFn: () => fetchContributionsByCampaign(campaignId, token),
    enabled: !!campaignId
  });

  // Group contributions by user to get unique backers
  const backersMap = new Map();
  contributions.forEach((contribution: Contribution) => {
    const userId = contribution.user.id;
    if (backersMap.has(userId)) {
      const existing = backersMap.get(userId);
      existing.totalAmount += contribution.amount;
      existing.contributions.push(contribution);
    } else {
      backersMap.set(userId, {
        user: contribution.user,
        totalAmount: contribution.amount,
        contributions: [contribution],
        firstContribution: contribution.createdAt,
        rewardTiers: contribution.rewardTier ? [contribution.rewardTier] : []
      });
    }
  });

  const backers = Array.from(backersMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTierBadgeColor = (amount: number) => {
    if (amount >= 1000) return 'bg-purple-100 text-purple-800';
    if (amount >= 500) return 'bg-blue-100 text-blue-800';
    if (amount >= 100) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getBadgeTitle = (amount: number) => {
    if (amount >= 1000) return 'Super Backer';
    if (amount >= 500) return 'Gold Backer';
    if (amount >= 100) return 'Silver Backer';
    return 'Backer';
  };

  // Calculate stats
  const totalBackers = backers.length;
  const totalContributions = contributions.length;
  const averageContribution = totalContributions > 0 
    ? contributions.reduce((sum: number, c: Contribution) => sum + c.amount, 0) / totalContributions 
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Backers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">Loading backers...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Backers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">Failed to load backers</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalBackers}</div>
            <div className="text-sm text-gray-600">Total Backers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalContributions}</div>
            <div className="text-sm text-gray-600">Contributions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{formatCurrency(averageContribution)}</div>
            <div className="text-sm text-gray-600">Avg. Contribution</div>
          </CardContent>
        </Card>
      </div>

      {/* Backers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Backers ({totalBackers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No backers yet</h3>
              <p className="text-gray-600">Be the first to support this campaign!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backers.map((backer, index) => (
                <div key={backer.user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {getInitials(backer.user.name || 'Anonymous')}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {backer.user.name || 'Anonymous Backer'}
                        </h4>
                        <Badge className={getTierBadgeColor(backer.totalAmount)}>
                          {getBadgeTitle(backer.totalAmount)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 gap-4">
                        <span>{backer.contributions.length} contribution{backer.contributions.length !== 1 ? 's' : ''}</span>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          First backed {formatDate(backer.firstContribution)}
                        </div>
                      </div>
                      {backer.rewardTiers.length > 0 && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {backer.rewardTiers[0].title}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(backer.totalAmount)}
                    </div>
                    {isCreator && (
                      <div className="text-xs text-gray-500 truncate max-w-32">
                        {backer.user.walletAddress.slice(0, 6)}...{backer.user.walletAddress.slice(-4)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity (if creator) */}
      {isCreator && contributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contributions.slice(0, 5).map((contribution: Contribution) => (
                <div key={contribution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-500 text-white text-xs">
                        {getInitials(contribution.user.name || 'A')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {contribution.user.name || 'Anonymous'} backed this campaign
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(contribution.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(contribution.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackersSection; 