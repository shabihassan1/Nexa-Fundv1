import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { voteOnMilestone } from '@/services/campaignService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface VoteButtonsProps {
  milestoneId: string;
  userHasVoted?: boolean;
  userVotingPower?: number;
  onVoteSuccess?: () => void;
}

export function VoteButtons({ 
  milestoneId, 
  userHasVoted, 
  userVotingPower = 0,
  onVoteSuccess 
}: VoteButtonsProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [selectedVote, setSelectedVote] = useState<boolean | null>(null);

  const voteMutation = useMutation({
    mutationFn: (isApproval: boolean) => {
      if (!token) throw new Error('Not authenticated');
      if (!privateKey) throw new Error('Private key required');
      
      return voteOnMilestone(
        milestoneId,
        {
          isApproval,
          comment: comment.trim() || undefined,
          voterPrivateKey: privateKey.trim()
        },
        token
      );
    },
    onSuccess: (data) => {
      // Invalidate voting stats to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['voting-stats', milestoneId] });
      
      toast({
        title: 'Vote Cast Successfully! 🗳️',
        description: `Your vote has been recorded on the blockchain. Voting power: $${data.vote?.votingPower?.toLocaleString() || userVotingPower.toLocaleString()}`,
      });
      
      // Reset form
      setComment('');
      setPrivateKey('');
      setShowPrivateKeyInput(false);
      setSelectedVote(null);
      
      onVoteSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Vote Failed',
        description: error.message || 'Failed to cast vote. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleVoteClick = (isApproval: boolean) => {
    setSelectedVote(isApproval);
    setShowPrivateKeyInput(true);
  };

  const handleConfirmVote = () => {
    if (selectedVote === null) return;
    voteMutation.mutate(selectedVote);
  };

  if (userHasVoted) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-gray-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              You have already voted on this milestone
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voting Power Display */}
      {userVotingPower > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Your Voting Power
            </span>
            <span className="text-lg font-bold text-blue-600">
              ${userVotingPower.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Based on your total contributions to this campaign
          </p>
        </div>
      )}

      {/* Comment Textarea */}
      <div className="space-y-2">
        <Label htmlFor="vote-comment" className="text-sm font-medium">
          Comment (Optional)
        </Label>
        <Textarea
          id="vote-comment"
          placeholder="Share your thoughts on this milestone completion..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={voteMutation.isPending}
          className="resize-none"
        />
        <div className="text-xs text-gray-500 text-right">
          {comment.length}/500 characters
        </div>
      </div>

      {/* Private Key Input (shown after clicking vote) */}
      {showPrivateKeyInput && (
        <div className="space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <Label htmlFor="private-key" className="text-sm font-medium text-amber-900">
            Wallet Private Key 🔐
          </Label>
          <input
            id="private-key"
            type="password"
            placeholder="0x..."
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            disabled={voteMutation.isPending}
            className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
          />
          <p className="text-xs text-amber-700">
            ⚠️ Your private key is needed to sign the blockchain transaction. It will <strong>NOT</strong> be stored or transmitted anywhere except to the blockchain.
          </p>
        </div>
      )}

      {/* Vote Buttons */}
      {!showPrivateKeyInput ? (
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleVoteClick(true)}
            disabled={voteMutation.isPending || userVotingPower === 0}
            className="bg-green-600 hover:bg-green-700 text-white py-6"
            size="lg"
          >
            <ThumbsUp className="mr-2 h-5 w-5" />
            Approve Release
          </Button>

          <Button
            onClick={() => handleVoteClick(false)}
            disabled={voteMutation.isPending || userVotingPower === 0}
            variant="destructive"
            className="py-6"
            size="lg"
          >
            <ThumbsDown className="mr-2 h-5 w-5" />
            Reject Release
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => {
              setShowPrivateKeyInput(false);
              setPrivateKey('');
              setSelectedVote(null);
            }}
            disabled={voteMutation.isPending}
            variant="outline"
            size="lg"
          >
            Cancel
          </Button>

          <Button
            onClick={handleConfirmVote}
            disabled={voteMutation.isPending || !privateKey.trim()}
            className={`${
              selectedVote 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            } text-white`}
            size="lg"
          >
            {voteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Voting...
              </>
            ) : (
              <>
                {selectedVote ? (
                  <>
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Confirm YES
                  </>
                ) : (
                  <>
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Confirm NO
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      )}

      {userVotingPower === 0 && (
        <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            You must be a backer of this campaign to vote
          </p>
        </div>
      )}
    </div>
  );
}
