import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Target, 
  CheckCircle, 
  Clock, 
  Vote,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import MilestoneCard from './MilestoneCard';

interface MilestoneListProps {
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    amount: number;
    currentAmount?: number;
    order: number;
    status: string;
    deadline: string;
    proofRequirements?: string;
    submittedAt?: string;
    approvedAt?: string;
    rejectedAt?: string;
    evidence?: any;
    adminNotes?: string;
    votesFor: number;
    votesAgainst: number;
    votingDeadline?: string;
    votes?: Array<{
      id: string;
      isApproval: boolean;
      comment?: string;
      user: {
        id: string;
        name: string;
      };
    }>;
    submissions?: Array<{
      id: string;
      evidence: any;
      description: string;
      submittedAt: string;
      status: string;
    }>;
  }>;
  isLoading?: boolean;
  isCreator?: boolean;
  isAuthenticated?: boolean;
  campaignId?: string;
  token?: string;
  onVote?: (milestoneId: string, isApproval: boolean) => void;
  onEdit?: (milestoneId: string) => void;
  onSubmit?: (milestoneId: string) => void;
  onViewDetails?: (milestoneId: string) => void;
  onCreateMilestone?: () => void;
  isVoting?: boolean;
}

const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones = [],
  isLoading = false,
  isCreator = false,
  isAuthenticated = false,
  campaignId,
  token,
  onVote,
  onEdit,
  onSubmit,
  onViewDetails,
  onCreateMilestone,
  isVoting = false
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Local formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter milestones based on selected status
  const filteredMilestones = selectedStatus === 'all' 
    ? milestones 
    : milestones.filter(milestone => milestone.status === selectedStatus.toUpperCase());

  // Calculate statistics
  const stats = {
    total: milestones.length,
    pending: milestones.filter(m => m.status === 'PENDING').length,
    voting: milestones.filter(m => m.status === 'VOTING').length,
    approved: milestones.filter(m => m.status === 'APPROVED').length,
    rejected: milestones.filter(m => m.status === 'REJECTED').length,
    totalAmount: milestones.reduce((sum, m) => sum + m.amount, 0),
    approvedAmount: milestones
      .filter(m => m.status === 'APPROVED')
      .reduce((sum, m) => sum + m.amount, 0)
  };

  const statusFilters = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'voting', label: 'Voting', count: stats.voting },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Milestones */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Milestone Statistics */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Milestones</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Funds Released</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.approvedAmount)}</p>
                  <p className="text-xs text-gray-500">
                    {stats.totalAmount > 0 ? `${((stats.approvedAmount / stats.totalAmount) * 100).toFixed(1)}%` : '0%'} of total
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Milestones</h2>
          <p className="text-gray-600">Track project progress and fund releases</p>
        </div>
        
        {isCreator && onCreateMilestone && milestones.length === 0 && (
          <Button 
            onClick={onCreateMilestone}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Milestones
          </Button>
        )}
      </div>

      {/* Status Filters */}
      {milestones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.key}
              variant={selectedStatus === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(filter.key)}
              className="flex items-center space-x-1"
            >
              <span>{filter.label}</span>
              {filter.count > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filter.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Quick Stats Bar */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-yellow-600 mr-1" />
              <span className="font-medium text-yellow-800">{stats.pending}</span>
            </div>
            <p className="text-xs text-yellow-700">Pending</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Vote className="h-4 w-4 text-purple-600 mr-1" />
              <span className="font-medium text-purple-800">{stats.voting}</span>
            </div>
            <p className="text-xs text-purple-700">Voting</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="font-medium text-green-800">{stats.approved}</span>
            </div>
            <p className="text-xs text-green-700">Approved</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              <span className="font-medium text-red-800">{stats.rejected}</span>
            </div>
            <p className="text-xs text-red-700">Rejected</p>
          </div>
        </div>
      )}

      {/* Milestone Cards */}
      {filteredMilestones.length > 0 ? (
        <div className="space-y-4">
          {filteredMilestones
            .sort((a, b) => a.order - b.order)
            .map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isCreator={isCreator}
                isAuthenticated={isAuthenticated}
                token={token}
                onVote={onVote}
                onEdit={onEdit}
                onSubmit={onSubmit}
                onViewDetails={onViewDetails}
                isVoting={isVoting}
              />
            ))}
        </div>
      ) : milestones.length === 0 ? (
        // No milestones exist
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No milestones yet</h3>
            <p className="text-gray-600 mb-6">
              {isCreator 
                ? "Milestones help backers track your progress and release funds as you achieve goals. Add milestones to build trust and organize your project timeline."
                : "This campaign hasn't set up milestones yet. Milestones help track project progress and ensure accountability."
              }
            </p>
            {isCreator && onCreateMilestone && (
              <Button 
                onClick={onCreateMilestone}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        // Filtered view has no results
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No {selectedStatus} milestones</h3>
            <p className="text-gray-600">
              No milestones found with status "{selectedStatus}". Try selecting a different filter.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setSelectedStatus('all')}
              className="mt-4"
            >
              Show All Milestones
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MilestoneList; 