import { API_URL } from '@/config';
export interface Activity {
  id: string;
  type: 'campaign_created' | 'campaign_updated' | 'contribution_received' | 'contribution_made' | 'milestone_created' | 'milestone_completed' | 'update_posted';
  title: string;
  description: string;
  timestamp: string;
  relatedId?: string;
  relatedType?: 'campaign' | 'contribution' | 'milestone' | 'update';
  metadata?: any;
}

export const fetchUserActivities = async (userId: string, token?: string): Promise<Activity[]> => {
  const activities: Activity[] = [];

  try {
    // Fetch user's campaigns for campaign-related activities
    const campaignsResponse = await fetch(`${API_URL}/campaigns?creatorId=${userId}`);
    if (campaignsResponse.ok) {
      const campaignsData = await campaignsResponse.json();
      const campaigns = campaignsData.campaigns || [];

      // Add campaign creation activities
      campaigns.forEach((campaign: any) => {
        activities.push({
          id: `campaign-created-${campaign.id}`,
          type: 'campaign_created',
          title: 'Campaign Created',
          description: `Created campaign "${campaign.title}"`,
          timestamp: campaign.createdAt,
          relatedId: campaign.id,
          relatedType: 'campaign',
          metadata: { campaignTitle: campaign.title, targetAmount: campaign.targetAmount }
        });

        // Add campaign update activity if updated recently
        if (campaign.updatedAt !== campaign.createdAt) {
          activities.push({
            id: `campaign-updated-${campaign.id}`,
            type: 'campaign_updated',
            title: 'Campaign Updated',
            description: `Updated campaign "${campaign.title}"`,
            timestamp: campaign.updatedAt,
            relatedId: campaign.id,
            relatedType: 'campaign',
            metadata: { campaignTitle: campaign.title }
          });
        }
      });

      // Fetch contributions for each campaign
      for (const campaign of campaigns) {
        try {
          const contributionsResponse = await fetch(`${API_URL}/campaigns/${campaign.id}/contributions`);
          if (contributionsResponse.ok) {
            const contributions = await contributionsResponse.json();
            
            contributions.forEach((contribution: any) => {
              activities.push({
                id: `contribution-received-${contribution.id}`,
                type: 'contribution_received',
                title: 'Contribution Received',
                description: `Received $${contribution.amount} backing for "${campaign.title}"`,
                timestamp: contribution.createdAt,
                relatedId: contribution.id,
                relatedType: 'contribution',
                metadata: { 
                  amount: contribution.amount, 
                  campaignTitle: campaign.title,
                  backerName: contribution.user?.name || 'Anonymous'
                }
              });
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch contributions for campaign ${campaign.id}`);
        }

        // Fetch milestones for each campaign
        try {
          const milestonesResponse = await fetch(`${API_URL}/campaigns/${campaign.id}/milestones`);
          if (milestonesResponse.ok) {
            const milestones = await milestonesResponse.json();
            
            milestones.forEach((milestone: any) => {
              activities.push({
                id: `milestone-created-${milestone.id}`,
                type: 'milestone_created',
                title: 'Milestone Created',
                description: `Created milestone "${milestone.title}" for "${campaign.title}"`,
                timestamp: milestone.createdAt,
                relatedId: milestone.id,
                relatedType: 'milestone',
                metadata: { 
                  milestoneTitle: milestone.title,
                  campaignTitle: campaign.title,
                  targetAmount: milestone.targetAmount
                }
              });

              if (milestone.status === 'COMPLETED') {
                activities.push({
                  id: `milestone-completed-${milestone.id}`,
                  type: 'milestone_completed',
                  title: 'Milestone Completed',
                  description: `Completed milestone "${milestone.title}" for "${campaign.title}"`,
                  timestamp: milestone.updatedAt,
                  relatedId: milestone.id,
                  relatedType: 'milestone',
                  metadata: { 
                    milestoneTitle: milestone.title,
                    campaignTitle: campaign.title
                  }
                });
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch milestones for campaign ${campaign.id}`);
        }

        // Fetch updates for each campaign
        try {
          const updatesResponse = await fetch(`${API_URL}/campaigns/${campaign.id}/updates`);
          if (updatesResponse.ok) {
            const updates = await updatesResponse.json();
            
            updates.forEach((update: any) => {
              activities.push({
                id: `update-posted-${update.id}`,
                type: 'update_posted',
                title: 'Update Posted',
                description: `Posted update "${update.title}" for "${campaign.title}"`,
                timestamp: update.createdAt,
                relatedId: update.id,
                relatedType: 'update',
                metadata: { 
                  updateTitle: update.title,
                  campaignTitle: campaign.title
                }
              });
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch updates for campaign ${campaign.id}`);
        }
      }
    }

    // Fetch user's contributions (campaigns they backed)
    const contributionsResponse = await fetch(`${API_URL}/contributions/user/${userId}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (contributionsResponse.ok) {
      const userContributions = await contributionsResponse.json();
      
      userContributions.forEach((contribution: any) => {
        activities.push({
          id: `contribution-made-${contribution.id}`,
          type: 'contribution_made',
          title: 'Backed Campaign',
          description: `Backed "${contribution.campaign?.title}" with $${contribution.amount}`,
          timestamp: contribution.createdAt,
          relatedId: contribution.id,
          relatedType: 'contribution',
          metadata: { 
            amount: contribution.amount,
            campaignTitle: contribution.campaign?.title,
            campaignId: contribution.campaign?.id
          }
        });
      });
    }

  } catch (error) {
    console.error('Error fetching user activities:', error);
  }

  // Sort activities by timestamp (most recent first)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'campaign_created':
      return '🚀';
    case 'campaign_updated':
      return '✏️';
    case 'contribution_received':
      return '💰';
    case 'contribution_made':
      return '❤️';
    case 'milestone_created':
      return '🎯';
    case 'milestone_completed':
      return '✅';
    case 'update_posted':
      return '📝';
    default:
      return '📅';
  }
};

export const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'campaign_created':
      return 'text-blue-600 bg-blue-50';
    case 'campaign_updated':
      return 'text-purple-600 bg-purple-50';
    case 'contribution_received':
      return 'text-green-600 bg-green-50';
    case 'contribution_made':
      return 'text-pink-600 bg-pink-50';
    case 'milestone_created':
      return 'text-orange-600 bg-orange-50';
    case 'milestone_completed':
      return 'text-emerald-600 bg-emerald-50';
    case 'update_posted':
      return 'text-indigo-600 bg-indigo-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}; 