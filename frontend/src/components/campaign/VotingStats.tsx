import { useQuery } from '@tanstack/react-query';
import { fetchMilestoneVotingStats } from '@/services/campaignService';
import { CheckCircle2, XCircle, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VotingStatsProps {
  milestoneId: string;
  token?: string;
}

export function VotingStats({ milestoneId, token }: VotingStatsProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['voting-stats', milestoneId],
    queryFn: () => fetchMilestoneVotingStats(milestoneId, token),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-sm text-red-600 p-4 bg-red-50 rounded-lg">
        Failed to load voting statistics
      </div>
    );
  }

  const approvalMet = stats.approvalPercentage >= 60;
  const quorumMet = stats.quorumPercentage >= 10;
  const bothMet = approvalMet && quorumMet;

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {bothMet && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-semibold text-green-800">
              Release Conditions Met! 🎉
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1 ml-7">
            This milestone will be automatically released when voting ends
          </p>
        </div>
      )}

      {/* Approval Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Approval Rate
          </span>
          <span className={`text-sm font-bold ${approvalMet ? 'text-green-600' : 'text-gray-900'}`}>
            {stats.approvalPercentage.toFixed(1)}% / 60% required
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div 
            className={`h-full transition-all ${approvalMet ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(stats.approvalPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {approvalMet ? '✅ Approval threshold met' : '⏳ Needs 60% approval to release'}
        </p>
      </div>

      {/* Quorum Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Voter Turnout (Quorum)
          </span>
          <span className={`text-sm font-bold ${quorumMet ? 'text-green-600' : 'text-gray-900'}`}>
            {stats.quorumPercentage.toFixed(1)}% / 10% required
          </span>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div 
            className={`h-full transition-all ${quorumMet ? 'bg-green-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(stats.quorumPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {quorumMet ? '✅ Quorum reached' : '⏳ Needs 10% of campaign goal in voting power'}
        </p>
      </div>

      {/* Vote Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-green-700">YES Votes</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-green-900">
              ${stats.votingPower.yes.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-1">
              {stats.votesFor} {stats.votesFor === 1 ? 'backer' : 'backers'}
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-700">NO Votes</span>
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-red-900">
              ${stats.votingPower.no.toLocaleString()}
            </div>
            <div className="text-xs text-red-600 mt-1">
              {stats.votesAgainst} {stats.votesAgainst === 1 ? 'backer' : 'backers'}
            </div>
          </div>
        </div>
      </div>

      {/* Total Participation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Total Participation
            </span>
          </div>
          <TrendingUp className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-xl font-bold text-gray-900">
            ${stats.votingPower.total.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 ml-2">
            voting power
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          {stats.totalVotes} {stats.totalVotes === 1 ? 'vote' : 'votes'} cast
        </div>
      </div>

      {/* Time Remaining */}
      {stats.voteEndTime && (
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">
            ⏰ Voting Period
          </div>
          <div className="text-sm font-semibold text-blue-900">
            {new Date(stats.voteEndTime) > new Date() 
              ? `Ends ${formatDistanceToNow(new Date(stats.voteEndTime), { addSuffix: true })}`
              : 'Voting Ended'}
          </div>
          {new Date(stats.voteEndTime) > new Date() && (
            <div className="text-xs text-blue-600 mt-1">
              Until {new Date(stats.voteEndTime).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Voter List (collapsed by default) */}
      {stats.voters && stats.voters.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium py-2">
            View all {stats.voters.length} {stats.voters.length === 1 ? 'voter' : 'voters'} →
          </summary>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
            {stats.voters.map((voter: any, index: number) => (
              <div 
                key={index} 
                className="flex items-start justify-between p-2 bg-white border border-gray-200 rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-900">
                      {voter.userName || 'Anonymous'}
                    </span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${
                      voter.vote ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {voter.vote ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Power: ${voter.power.toLocaleString()}
                  </div>
                  {voter.comment && (
                    <div className="text-xs text-gray-600 mt-1 italic">
                      "{voter.comment}"
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 ml-2">
                  {formatDistanceToNow(new Date(voter.votedAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
