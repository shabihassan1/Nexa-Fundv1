import React from 'react';
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
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MilestoneCardProps {
  milestone: {
    id: string;
    title: string;
    description: string;
    amount: number;
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
  isCreator?: boolean;
  isAuthenticated?: boolean;
  onVote?: (milestoneId: string, isApproval: boolean) => void;
  onEdit?: (milestoneId: string) => void;
  onSubmit?: (milestoneId: string) => void;
  onViewDetails?: (milestoneId: string) => void;
  isVoting?: boolean;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  isCreator = false,
  isAuthenticated = false,
  onVote,
  onEdit,
  onSubmit,
  onViewDetails,
  isVoting = false
}) => {
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
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
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SUBMITTED': return <Upload className="h-4 w-4" />;
      case 'VOTING': return <Users className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isOverdue = new Date(milestone.deadline) < new Date() && milestone.status === 'PENDING';
  const votingEnded = milestone.votingDeadline && new Date(milestone.votingDeadline) < new Date();

  const borderColor = milestone.status === 'APPROVED' ? 'border-l-green-500' : 
                     milestone.status === 'REJECTED' ? 'border-l-red-500' :
                     milestone.status === 'VOTING' ? 'border-l-purple-500' :
                     'border-l-blue-500';

  return (
    <Card className={`${borderColor} border-l-4 hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${milestone.status === 'APPROVED' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {getStatusIcon(milestone.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-lg">
                  Milestone {milestone.order}: {milestone.title}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(milestone.status)}
                >
                  {getStatusIcon(milestone.status)}
                  <span className="ml-1 capitalize">{milestone.status.toLowerCase()}</span>
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
              {milestone.status === 'PENDING' && onSubmit && (
                <Button
                  size="sm"
                  onClick={() => onSubmit(milestone.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Submit
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

        {/* Voting Section */}
        {(milestone.status === 'VOTING' || milestone.status === 'SUBMITTED' || totalVotes > 0) && (
          <>
            <Separator />
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Community Voting
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                  {milestone.votingDeadline && (
                    <span>
                      Ends: {new Date(milestone.votingDeadline).toLocaleDateString()}
                      {votingEnded && <span className="text-red-600 ml-1">(Ended)</span>}
                    </span>
                  )}
                </div>
              </div>
              
              {totalVotes > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Approval Rate</span>
                    <span>{approvalRate.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={approvalRate} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span className="flex items-center">
                      <ThumbsUp className="h-3 w-3 mr-1 text-green-600" />
                      {milestone.votesFor} approve
                    </span>
                    <span className="flex items-center">
                      <ThumbsDown className="h-3 w-3 mr-1 text-red-600" />
                      {milestone.votesAgainst} reject
                    </span>
                  </div>
                </div>
              )}
              
              {/* Voting Buttons */}
              {isAuthenticated && milestone.status === 'VOTING' && !votingEnded && onVote && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVote(milestone.id, true)}
                    disabled={isVoting}
                    className="flex-1 border-green-200 hover:bg-green-50"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1 text-green-600" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVote(milestone.id, false)}
                    disabled={isVoting}
                    className="flex-1 border-red-200 hover:bg-red-50"
                  >
                    <ThumbsDown className="h-4 w-4 mr-1 text-red-600" />
                    Reject
                  </Button>
                </div>
              )}
              
              {milestone.status === 'VOTING' && votingEnded && (
                <div className="text-center text-sm text-gray-600 bg-gray-100 rounded p-2">
                  Voting period has ended. Results are being processed.
                </div>
              )}
              
              {!isAuthenticated && milestone.status === 'VOTING' && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                      Log in
                    </Link> to vote on this milestone
                  </p>
                </div>
              )}
              
              {milestone.status === 'SUBMITTED' && (
                <div className="text-center text-sm text-gray-600 bg-blue-50 rounded p-2">
                  This milestone is under review. Voting will begin shortly.
                </div>
              )}
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
    </Card>
  );
};

export default MilestoneCard; 