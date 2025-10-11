import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/config';
import {
  fetchMilestonesByCampaign,
  fetchMilestoneById,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  voteOnMilestone
} from '@/services/milestoneService';

// Hook for fetching milestones by campaign
export const useMilestonesByCampaign = (campaignId: string, enabled: boolean = true) => {
  const { token, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['milestones', 'campaign', campaignId],
    queryFn: () => fetchMilestonesByCampaign(campaignId, token || undefined),
    enabled: enabled && !!campaignId && !isLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Hook for fetching a single milestone
export const useMilestone = (milestoneId: string, enabled: boolean = true) => {
  const { token, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['milestone', milestoneId],
    queryFn: () => fetchMilestoneById(milestoneId, token || undefined),
    enabled: enabled && !!milestoneId && !isLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for creating milestones
export const useCreateMilestones = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      campaignId: string; 
      milestones: Array<{
        title: string;
        description: string;
        amount: number;
        deadline: string;
        order: number;
      }>
    }) => {
      if (!token) throw new Error('Authentication required');
      
      const response = await fetch(`${API_URL}/campaigns/${data.campaignId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ milestones: data.milestones })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create milestones');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch milestones for this campaign
      queryClient.invalidateQueries({ 
        queryKey: ['milestones', 'campaign', variables.campaignId] 
      });
      
      // Also invalidate campaign data to update milestone info
      queryClient.invalidateQueries({ 
        queryKey: ['campaign', variables.campaignId] 
      });

      toast({
        title: "Milestones created successfully",
        description: `${variables.milestones.length} milestone(s) have been added to your campaign.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create milestones",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

// Hook for updating a milestone
export const useUpdateMilestone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      milestoneId: string; 
      updates: {
        title?: string;
        description?: string;
        amount?: number;
        deadline?: string;
      }
    }) => {
      if (!token) throw new Error('Authentication required');
      return updateMilestone(data.milestoneId, data.updates, token);
    },
    onSuccess: (data, variables) => {
      // Update the specific milestone in cache
      queryClient.setQueryData(
        ['milestone', variables.milestoneId],
        data
      );

      // Invalidate milestones list to refresh the data
      queryClient.invalidateQueries({ 
        queryKey: ['milestones'] 
      });

      toast({
        title: "Milestone updated",
        description: "Your milestone has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update milestone",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

// Hook for deleting a milestone
export const useDeleteMilestone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (milestoneId: string) => {
      if (!token) throw new Error('Authentication required');
      return deleteMilestone(milestoneId, token);
    },
    onSuccess: (data, milestoneId) => {
      // Remove milestone from cache
      queryClient.removeQueries({ 
        queryKey: ['milestone', milestoneId] 
      });

      // Invalidate milestones lists
      queryClient.invalidateQueries({ 
        queryKey: ['milestones'] 
      });

      toast({
        title: "Milestone deleted",
        description: "The milestone has been removed from your campaign.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete milestone",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

// Hook for voting on milestones
export const useVoteOnMilestone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      milestoneId: string; 
      isApproval: boolean;
      comment?: string;
    }) => {
      if (!token) throw new Error('Authentication required');
      
      const response = await fetch(`${API_URL}/milestones/${data.milestoneId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          isApproval: data.isApproval,
          comment: data.comment 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote on milestone');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update the milestone data in cache
      queryClient.setQueryData(
        ['milestone', variables.milestoneId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            milestone: data.milestone
          };
        }
      );

      // Invalidate milestones list to refresh vote counts
      queryClient.invalidateQueries({ 
        queryKey: ['milestones'] 
      });

      // Also invalidate campaign data that includes milestones
      queryClient.invalidateQueries({ 
        queryKey: ['campaign'] 
      });

      toast({
        title: variables.isApproval ? "Vote cast: Approved" : "Vote cast: Rejected",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cast vote",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

// Hook for submitting milestone evidence
export const useSubmitMilestone = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (data: { 
      milestoneId: string;
      evidence: any;
      description: string;
    }) => {
      if (!token) throw new Error('Authentication required');
      
      const response = await fetch(`${API_URL}/milestones/${data.milestoneId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          evidence: data.evidence,
          description: data.description
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit milestone');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update milestone status in cache
      queryClient.setQueryData(
        ['milestone', variables.milestoneId],
        data
      );

      // Invalidate milestones list
      queryClient.invalidateQueries({ 
        queryKey: ['milestones'] 
      });

      // Invalidate campaign data
      queryClient.invalidateQueries({ 
        queryKey: ['campaign'] 
      });

      toast({
        title: "Milestone submitted",
        description: "Your milestone evidence has been submitted for community review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit milestone",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

// Hook for getting milestone statistics
export const useMilestoneStats = (campaignId: string, enabled: boolean = true) => {
  const { token, isLoading } = useAuth();
  
  return useQuery({
    queryKey: ['milestone-stats', campaignId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/campaigns/${campaignId}/milestones/stats`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch milestone statistics');
      }

      return response.json();
    },
    enabled: enabled && !!campaignId && !isLoading, // Wait for auth to complete
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Utility hook for milestone-related operations
export const useMilestoneOperations = (campaignId?: string) => {
  const milestonesQuery = useMilestonesByCampaign(campaignId || '', !!campaignId);
  const createMilestones = useCreateMilestones();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const voteOnMilestone = useVoteOnMilestone();
  const submitMilestone = useSubmitMilestone();
  const statsQuery = useMilestoneStats(campaignId || '', !!campaignId);

  return {
    // Data
    milestones: milestonesQuery.data?.milestones || [],
    stats: statsQuery.data || null,
    
    // Loading states
    isLoading: milestonesQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    
    // Error states
    error: milestonesQuery.error,
    statsError: statsQuery.error,
    
    // Mutations
    createMilestones: {
      mutate: createMilestones.mutate,
      isPending: createMilestones.isPending,
      error: createMilestones.error
    },
    updateMilestone: {
      mutate: updateMilestone.mutate,
      isPending: updateMilestone.isPending,
      error: updateMilestone.error
    },
    deleteMilestone: {
      mutate: deleteMilestone.mutate,
      isPending: deleteMilestone.isPending,
      error: deleteMilestone.error
    },
    voteOnMilestone: {
      mutate: voteOnMilestone.mutate,
      isPending: voteOnMilestone.isPending,
      error: voteOnMilestone.error
    },
    submitMilestone: {
      mutate: submitMilestone.mutate,
      isPending: submitMilestone.isPending,
      error: submitMilestone.error
    },
    
    // Refetch functions
    refetch: milestonesQuery.refetch,
    refetchStats: statsQuery.refetch
  };
}; 