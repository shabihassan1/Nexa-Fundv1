import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  Edit,
  Upload,
  Eye,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { VotingStats } from './VotingStats';
import { VoteButtons } from './VoteButtons';
import MilestoneSubmissionModal from './MilestoneSubmissionModal';

interface MilestoneCardProps {
  milestone: {
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
  };
  campaignId?: string;
  isCreator?: boolean;
  isAuthenticated?: boolean;
  userHasVoted?: boolean;
  userVotingPower?: number;
  token?: string;
  onVote?: (milestoneId: string, isApproval: boolean) => void;
  onEdit?: (milestoneId: string) => void;
  onSubmit?: (milestoneId: string) => void;
  onViewDetails?: (milestoneId: string) => void;
  onRefetch?: () => void;
  isVoting?: boolean;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  campaignId,
  isCreator = false,
  isAuthenticated = false,
  userHasVoted = false,
  userVotingPower = 0,
  token,
  onVote,
  onEdit,
  onSubmit,
  onViewDetails,
  onRefetch,
  isVoting = false
}) => {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  // Local formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalVotes = milestone.votesFor + milestone.votesAgainst;
  const approvalRate = totalVotes > 0 ? (milestone.votesFor / totalVotes) * 100 : 0;
  
  // Determine display status based on intelligent availability logic
  // Show "ACTIVE" for milestones that are accepting contributions
  const getDisplayStatus = () => {
    const currentAmount = milestone.currentAmount || 0;
    const targetAmount = milestone.amount || 0;
    const isFullyFunded = currentAmount >= targetAmount;

    // If already in a final state, keep showing that
    if (['SUBMITTED', 'VOTING', 'APPROVED', 'REJECTED'].includes(milestone.status)) {
      return milestone.status;
    }

    // For PENDING status, check if it's actually available for contributions
    if (milestone.status === 'PENDING') {
      // First milestone that's not fully funded should show as ACTIVE
      if (milestone.order === 1 && !isFullyFunded) {
        return 'ACTIVE';
      }
      
      // If fully funded but not submitted yet, show as PENDING (awaiting proof)
      if (isFullyFunded) {
        return 'PENDING';
      }
      
      // For other milestones, keep PENDING (they're waiting for previous approval)
      return 'PENDING';
    }

    return milestone.status;
  };

  const displayStatus = getDisplayStatus();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'VOTING': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Target className="h-4 w-4" />;
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SUBMITTED': return <Upload className="h-4 w-4" />;
      case 'VOTING': return <Users className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isOverdue = new Date(milestone.deadline) < new Date() && displayStatus === 'PENDING';
  const votingEnded = milestone.votingDeadline && new Date(milestone.votingDeadline) < new Date();

  const borderColor = displayStatus === 'APPROVED' ? 'border-l-green-500' : 
                     displayStatus === 'REJECTED' ? 'border-l-red-500' :
                     displayStatus === 'VOTING' ? 'border-l-purple-500' :
                     displayStatus === 'ACTIVE' ? 'border-l-green-500' :
                     'border-l-blue-500';

  return (
    <Card className={`${borderColor} border-l-4 hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${displayStatus === 'APPROVED' || displayStatus === 'ACTIVE' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {getStatusIcon(displayStatus)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-lg">
                  Milestone {milestone.order}: {milestone.title}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(displayStatus)}
                >
                  {getStatusIcon(displayStatus)}
                  <span className="ml-1 capitalize">
                    {displayStatus === 'ACTIVE' ? 'Active - Accepting Contributions' : displayStatus.toLowerCase()}
                  </span>
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatCurrency(milestone.amount)}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due: {new Date(milestone.deadline).toLocaleDateString()}
                  {isOverdue && (
                    <span className="ml-1 text-red-600 font-medium">(Overdue)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isCreator && (
            <div className="flex space-x-2">
              {milestone.status === 'PENDING' && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(milestone.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {(milestone.status === 'PENDING' || milestone.status === 'ACTIVE') && onSubmit && (
                <Button
                  size="sm"
                  onClick={() => setShowSubmissionModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Submit for Voting
                </Button>
              )}
              {onViewDetails && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(milestone.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Funding Progress */}
        {milestone.currentAmount !== undefined && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Funding Progress</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(milestone.currentAmount)} / {formatCurrency(milestone.amount)}
              </span>
            </div>
            <Progress 
              value={(milestone.currentAmount / milestone.amount) * 100} 
              className="h-2"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-600">
                {((milestone.currentAmount / milestone.amount) * 100).toFixed(1)}% funded
              </span>
              {milestone.currentAmount >= milestone.amount && (
                <span className="text-xs font-medium text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Fully Funded!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-700 leading-relaxed">{milestone.description}</p>

        {/* Proof Requirements */}
        {milestone.proofRequirements && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 text-sm mb-1 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1.5 text-gray-600" />
              Proof of Completion
            </h4>
            <p className="text-gray-700 text-sm">{milestone.proofRequirements}</p>
          </div>
        )}

        {/* Evidence Section */}
        {milestone.evidence && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Submitted Evidence</h4>
            <p className="text-blue-800 text-sm">
              Evidence has been submitted and is under review.
            </p>
            {milestone.submittedAt && (
              <p className="text-blue-600 text-xs mt-1">
                Submitted: {new Date(milestone.submittedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Admin Notes */}
        {milestone.adminNotes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Admin Notes</h4>
            <p className="text-amber-800 text-sm">{milestone.adminNotes}</p>
          </div>
        )}

        {/* Pending Milestone Fully Funded Notice */}
        {milestone.status === 'PENDING' && milestone.currentAmount && milestone.currentAmount >= milestone.amount && (
          <>
            <Separator />
            <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium text-green-900 mb-1">🎉 Milestone Fully Funded!</h4>
              <p className="text-sm text-green-700 mb-2">
                This milestone has reached its funding goal of {formatCurrency(milestone.amount)}
              </p>
              {isCreator && (
                <p className="text-xs text-green-600 font-medium">
                  📝 Submit proof of completion to start the voting process and release funds
                </p>
              )}
              {!isCreator && (
                <p className="text-xs text-green-600">
                  Waiting for creator to submit proof of completion
                </p>
              )}
            </div>
          </>
        )}

        {/* Voting Section - New Weighted Voting UI */}
        {milestone.status === 'VOTING' && (
          <>
            <Separator />
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                <h4 className="font-medium text-gray-900">
                  Weighted Voting Active
                </h4>
              </div>

              {/* Real-time Voting Stats */}
              <VotingStats milestoneId={milestone.id} token={token} />

              {/* Vote Buttons */}
              {isAuthenticated && !votingEnded && (
                <div className="mt-4">
                  <VoteButtons
                    milestoneId={milestone.id}
                    userHasVoted={userHasVoted}
                    userVotingPower={userVotingPower}
                    onVoteSuccess={() => {
                      if (onRefetch) onRefetch();
                    }}
                  />
                </div>
              )}

              {milestone.status === 'VOTING' && votingEnded && (
                <div className="text-center text-sm text-gray-600 bg-gray-100 rounded p-2 mt-4">
                  Voting period has ended. Results are being processed.
                </div>
              )}

              {!isAuthenticated && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                      Log in
                    </Link> to vote on this milestone
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Submitted Status */}
        {milestone.status === 'SUBMITTED' && (
          <>
            <Separator />
            <div className="text-center text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
              <Upload className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              This milestone has been submitted for review. Voting will open automatically.
            </div>
          </>
        )}

        {/* Recent Votes */}
        {milestone.votes && milestone.votes.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Recent Votes</h5>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {milestone.votes.slice(0, 3).map((vote) => (
                <div key={vote.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                  <span className="font-medium">{vote.user.name}</span>
                  <div className="flex items-center">
                    {vote.isApproval ? (
                      <ThumbsUp className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <ThumbsDown className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={vote.isApproval ? 'text-green-600' : 'text-red-600'}>
                      {vote.isApproval ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
              ))}
              {milestone.votes.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{milestone.votes.length - 3} more votes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status-specific information */}
        {milestone.status === 'APPROVED' && milestone.approvedAt && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Milestone approved and funds released
              </span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Approved: {new Date(milestone.approvedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {milestone.status === 'REJECTED' && milestone.rejectedAt && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">
                Milestone rejected
              </span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Rejected: {new Date(milestone.rejectedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>

      {/* Milestone Submission Modal */}
      <MilestoneSubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        milestone={milestone}
        onSubmit={(submissionData) => {
          // Call the onSubmit prop if provided
          if (onSubmit) {
            onSubmit(milestone.id);
          }
          setShowSubmissionModal(false);
          if (onRefetch) onRefetch();
        }}
      />
    </Card>
  );
};

export default MilestoneCard; 