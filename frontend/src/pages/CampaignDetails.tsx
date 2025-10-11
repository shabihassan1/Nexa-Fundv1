import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WalletConnect from "@/components/WalletConnect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarDays, 
  Users, 
  ArrowLeft, 
  Edit2, 
  Target,
  Clock,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Share2,
  Flag,
  Heart,
  Gift,
  Edit,
  AlertCircle,
  Settings,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { fetchCampaignById } from "@/services/campaignService";
import { fetchUserById } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import StoredImage from "@/components/ui/StoredImage";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import RewardTiers from "@/components/campaign/RewardTiers";
import BackingModal from '@/components/BackingModal';
import MilestoneList from "@/components/campaign/MilestoneList";
import MilestoneModal from "@/components/campaign/MilestoneModal";
import UpdatesSection from "@/components/campaign/UpdatesSection";
import BackersSection from "@/components/campaign/BackersSection";
import { useMilestoneOperations } from "@/hooks/useMilestones";
import { API_URL } from "@/config";

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'story' | 'milestones' | 'updates' | 'backers' | 'rewards'>('story');
  const [isBackingModalOpen, setIsBackingModalOpen] = useState(false);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Check where user came from
  const [cameFromAdmin, setCameFromAdmin] = useState(false);
  const [cameFromBrowse, setCameFromBrowse] = useState(false);

  // Milestone operations
  const {
    milestones,
    createMilestones,
    voteOnMilestone: voteOnMilestoneMutation,
    isLoading: milestonesLoading
  } = useMilestoneOperations(id);
  
  useEffect(() => {
    // Check if user came from admin panel or browse
    const referrer = document.referrer;
    const searchParams = new URLSearchParams(location.search);
    const fromParam = searchParams.get('from');
    
    // Check if came from admin routes or has admin param
    const isFromAdmin = fromParam === 'admin' || 
                       referrer.includes('/admin/campaigns') || 
                       referrer.includes('/admin');
    
    // Check if came from browse
    const isFromBrowse = fromParam === 'browse' || 
                        referrer.includes('/browse');
    
    setCameFromAdmin(isFromAdmin && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'));
    setCameFromBrowse(isFromBrowse);
  }, [location, user]);

  const { data: campaign, isLoading: campaignLoading, error: campaignError } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => id ? fetchCampaignById(id) : Promise.reject('No campaign ID provided'),
    enabled: !!id
  });

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ['user', campaign?.creatorId],
    queryFn: () => {
      if (campaign?.creatorId && token) {
        return fetchUserById(campaign.creatorId, token)
          .catch(err => {
            console.error("Error fetching creator:", err);
            return null;
          });
      }
      return Promise.resolve(null);
    },
    enabled: !!campaign?.creatorId && !!token,
    retry: false
  });

  // Vote on milestone mutation
  const voteOnMilestone = useMutation({
    mutationFn: async ({ milestoneId, isApproval }: { milestoneId: string, isApproval: boolean }) => {
      const response = await fetch(`${API_URL}/milestones/${milestoneId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproval })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote cast successfully",
        description: "Your vote has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to vote",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Check if the current user is the campaign creator
  const isCreator = isAuthenticated && campaign?.creatorId === user?.id;

  // Check if this is the creator's own campaign and they need to set up their wallet
  const isCreatorWithInvalidWallet = isCreator && 
    (!campaign.creator?.walletAddress || campaign.creator.walletAddress.startsWith('temp-'));

  // Handle edit images button click
  const handleEditImages = () => {
    // Pass context to edit page so it can navigate back appropriately
    if (cameFromBrowse) {
      navigate(`/campaign/${id}/edit?from=browse`);
    } else {
      navigate(`/campaign/${id}/edit`);
    }
  };

  // Handle milestone voting
  const handleVote = (milestoneId: string, isApproval: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on milestones.",
        variant: "destructive",
      });
      return;
    }
    
    voteOnMilestone.mutate({ milestoneId, isApproval });
  };

  // Handle milestone creation
  const handleCreateMilestone = () => {
    if (!isCreator) {
      toast({
        title: "Access denied",
        description: "Only campaign creators can add milestones.",
        variant: "destructive",
      });
      return;
    }
    setIsMilestoneModalOpen(true);
  };

  // Handle milestone submission
  const handleSubmitMilestones = (milestonesData: any[]) => {
    if (!id) return;
    
    createMilestones.mutate({
      campaignId: id,
      milestones: milestonesData
    }, {
      onSuccess: () => {
        setIsMilestoneModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      }
    });
  };

  // Handle image gallery modal
  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const nextImage = () => {
    if (campaign?.additionalMedia && campaign.additionalMedia.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % campaign.additionalMedia.length);
    }
  };

  const prevImage = () => {
    if (campaign?.additionalMedia && campaign.additionalMedia.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + campaign.additionalMedia.length) % campaign.additionalMedia.length);
    }
  };

  // Handle keyboard navigation for image modal
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return;
      
      if (e.key === 'Escape') {
        closeImageModal();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isImageModalOpen, campaign?.additionalMedia]);

  const handleBackProject = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to back this campaign.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (isCreator) {
      toast({
        title: "Self-Backing Prevention",
        description: "You cannot back your own campaign.",
        variant: "destructive",
      });
      return;
    }

    // Check if campaign is active - only active campaigns can be backed
    if (campaign.status !== 'ACTIVE') {
      toast({
        title: "Campaign Not Available",
        description: "Only active campaigns can be backed. This campaign is currently pending approval.",
        variant: "destructive",
      });
      return;
    }

    // Debug: Log campaign data to understand the structure
    console.log("Campaign data before opening modal:", campaign);
    console.log("Campaign creator:", campaign?.creator);
    console.log("Campaign creator wallet address:", campaign?.creator?.walletAddress);

    setIsBackingModalOpen(true);
  };

  const handleContributionSuccess = () => {
    // Refetch campaign data to update progress
    queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    
    toast({
      title: "Thank you for your support!",
      description: "Your contribution has been recorded successfully.",
    });
  };

  if (campaignLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 py-8">
            <div className="container">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-12 w-2/3 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-4" />
            </div>
          </div>
          <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Skeleton className="h-96 w-full rounded-lg mb-8" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-6 w-1/2 mb-6" />
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (campaignError || !campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
          <p className="mb-8">The campaign you're looking for doesn't exist or has been removed.</p>
          <Link to="/browse">
            <Button>Browse Campaigns</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate progress percentage
  const progress = Math.min(Math.round(((campaign.currentAmount || 0) / (campaign.targetAmount || 1)) * 100), 100);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate days left
  const calculateDaysLeft = () => {
    if (!campaign.endDate) return 0;
    const endDate = new Date(campaign.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysLeft = calculateDaysLeft();

  // Get creator name safely
  const getCreatorName = () => {
    if (creatorLoading) {
      return <Skeleton className="h-4 w-24 inline-block" />;
    }
    
    if (campaign?.creator?.name) {
      return campaign.creator.name;
    }
    
    if (creator && typeof creator === 'object') {
      return creator.name || 'Anonymous';
    }
    
    if (campaign?.creator?.walletAddress) {
      return `${campaign.creator.walletAddress.slice(0, 6)}...${campaign.creator.walletAddress.slice(-4)}`;
    }
    
    return 'Anonymous Creator';
  };

  // Process additionalMedia to ensure it's an array
  let additionalMediaArray: string[] = [];
  
  if (campaign.additionalMedia) {
    if (Array.isArray(campaign.additionalMedia)) {
      additionalMediaArray = campaign.additionalMedia;
    } else if (typeof campaign.additionalMedia === 'string') {
      try {
        const parsed = JSON.parse(campaign.additionalMedia);
        if (Array.isArray(parsed)) {
          additionalMediaArray = parsed;
        }
      } catch (e) {
        console.error("Failed to parse additionalMedia string:", e);
      }
    }
  }
  
  const hasAdditionalMedia = additionalMediaArray.length > 0;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 py-8">
          <div className="container">
            <div className="flex items-center gap-4 mb-6">
              {/* Primary navigation based on where user came from */}
              {cameFromAdmin ? (
                <Link to="/admin/campaigns" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Campaign Management
                </Link>
              ) : (
                <Link to="/browse" className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to {cameFromBrowse ? 'Browse' : 'campaigns'}
                </Link>
              )}
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={getStatusColor(campaign.status || 'ACTIVE')}>
                    {campaign.status || 'ACTIVE'}
                  </Badge>
                  <Badge variant="outline">{campaign.category}</Badge>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {campaign.title}
                </h1>
                <p className="text-xl text-gray-600 mb-6 max-w-3xl">
                  {campaign.description}
                </p>
              </div>
              
              <div className="flex gap-2">
                {isCreator && (
                  <Button variant="outline" onClick={handleEditImages}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Images
                  </Button>
                )}
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/admin/campaigns/${id}/edit`)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          {/* Wallet Setup Warning for Campaign Creator */}
          {isCreatorWithInvalidWallet && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-amber-800 font-medium">Set Up Your Wallet to Receive Contributions</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    Connect your MetaMask wallet so supporters can send you contributions directly. 
                    Without a valid wallet address, people cannot back your campaign.
                  </p>
                  <div className="mt-3">
                    <WalletConnect />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Status Warnings */}
          {campaign.status === 'PENDING' && (
            <div className="mb-6">
              {isCreator ? (
                /* Creator view for pending campaign */
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-blue-800 font-medium">Campaign Pending Approval</h3>
                      <p className="text-blue-700 text-sm mt-1">
                        Your campaign is currently under review by our administrators. To improve approval chances:
                      </p>
                      <ul className="text-blue-700 text-sm mt-2 space-y-1 list-disc list-inside">
                        <li>Complete all milestone information with clear targets and descriptions</li>
                        <li>Upload high-quality images that showcase your project effectively</li>
                        <li>Ensure your project story is detailed and compelling</li>
                        <li>Verify all reward tiers are properly configured</li>
                      </ul>
                      <div className="mt-3 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTab('milestones')}
                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Review Milestones
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleEditImages}
                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update Images
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-creator view for pending campaign */
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-yellow-800 font-medium">Campaign Not Available for Backing</h3>
                      <p className="text-yellow-700 text-sm mt-1">
                        This campaign is currently pending administrative approval and cannot accept contributions yet. 
                        Once approved, you'll be able to back this project. Please check back later or explore other active campaigns.
                      </p>
                      <div className="mt-3">
                        <Link to="/browse">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                          >
                            Browse Active Campaigns
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {campaign.status === 'CANCELLED' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <X className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-red-800 font-medium">Campaign Cancelled</h3>
                  <p className="text-red-700 text-sm mt-1">
                    This campaign has been cancelled and is no longer accepting contributions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {campaign.status === 'COMPLETED' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-green-800 font-medium">Campaign Successfully Completed</h3>
                  <p className="text-green-700 text-sm mt-1">
                    This campaign has reached its funding goal and is now complete. No additional contributions are being accepted.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Campaign Image */}
              <div className="mb-8 relative">
                <StoredImage
                  storageKey={campaign.imageUrl}
                  alt={campaign.title}
                  className="w-full h-96 object-cover rounded-xl shadow-lg"
                  fallbackSrc="/placeholder.svg"
                />
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-gray-200 mb-8">
                <nav className="flex space-x-8">
                  {[
                    { id: 'story', label: 'Story', icon: null },
                    { id: 'milestones', label: 'Milestones', icon: Target },
                    { id: 'rewards', label: 'Rewards', icon: Gift },
                    { id: 'updates', label: 'Updates', icon: TrendingUp },
                    { id: 'backers', label: 'Backers', icon: Users }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        selectedTab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
                        {tab.label}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {selectedTab === 'story' && (
                <div className="prose max-w-none space-y-8">
                  <div className="bg-white rounded-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Project Story</h2>
                    <div className="space-y-4 text-gray-700 leading-relaxed">
                      <p>{campaign.story || campaign.description}</p>
                    </div>
                  </div>

                  {/* Additional Media Gallery */}
                  {campaign?.additionalMedia && Array.isArray(campaign.additionalMedia) && campaign.additionalMedia.length > 0 && (
                    <div className="bg-white rounded-lg p-6">
                      <h3 className="text-xl font-bold mb-4">Project Gallery</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {campaign.additionalMedia.map((mediaUrl, index) => (
                          <div 
                            key={index} 
                            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            onClick={() => openImageModal(index)}
                          >
                            <StoredImage
                              storageKey={mediaUrl}
                              alt={`${campaign?.title} - Gallery Image ${index + 1}`}
                              className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-300"
                              fallbackSrc="/placeholder.svg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-2">
                                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        {campaign.additionalMedia.length} {campaign.additionalMedia.length === 1 ? 'image' : 'images'} in project gallery
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'milestones' && (
                <MilestoneList
                  milestones={milestones}
                  isLoading={milestonesLoading}
                  isCreator={isCreator}
                  isAuthenticated={isAuthenticated}
                  campaignId={id}
                  onVote={handleVote}
                  onCreateMilestone={handleCreateMilestone}
                  isVoting={voteOnMilestone.isPending}
                />
              )}

              {selectedTab === 'rewards' && (
                <RewardTiers 
                  rewardTiers={campaign.rewardTiers || []} 
                  showSelectButton={!isCreator}
                  isCreator={isCreator}
                  onSelectTier={(tier) => {
                    if (!isCreator) {
                      toast({
                        title: "Reward Selected",
                        description: `You selected the "${tier.title}" reward tier for ${formatCurrency(tier.minimumAmount)}+. Click "Back This Project" to proceed.`,
                      });
                    }
                  }}
                />
              )}

              {selectedTab === 'updates' && (
                <UpdatesSection 
                  campaignId={id!} 
                  isCreator={isCreator} 
                />
              )}

              {selectedTab === 'backers' && (
                <BackersSection 
                  campaignId={id!} 
                  isCreator={isCreator} 
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  {/* Progress */}
                  <div className="mb-6">
                    <Progress value={progress} className="h-3 mb-3" />
                    <div className="space-y-2">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-green-600">
                          {formatCurrency(campaign.currentAmount || 0)}
                        </span>
                        <span className="text-gray-500 ml-2">raised</span>
                      </div>
                      <p className="text-gray-600">
                        of {formatCurrency(campaign.targetAmount || 0)} goal
                      </p>
                      <p className="text-sm text-gray-500">
                        {progress}% funded
                      </p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Users className="h-5 w-5 text-gray-500 mr-1" />
                      </div>
                      <p className="text-2xl font-bold">{campaign._count?.contributions || 0}</p>
                      <p className="text-sm text-gray-600">Backers</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CalendarDays className="h-5 w-5 text-gray-500 mr-1" />
                      </div>
                      <p className="text-2xl font-bold">{daysLeft}</p>
                      <p className="text-sm text-gray-600">Days left</p>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      onClick={handleBackProject}
                      className={`w-full py-3 text-lg font-medium ${
                        campaign.status === 'ACTIVE' && !isCreator
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                      disabled={isCreator || campaign.status !== 'ACTIVE'}
                    >
                      <Heart className="h-5 w-5 mr-2" />
                      {isCreator 
                        ? "Your Campaign" 
                        : campaign.status === 'ACTIVE' 
                          ? "Back this project"
                          : campaign.status === 'PENDING'
                            ? "Pending Approval"
                            : campaign.status === 'COMPLETED'
                              ? "Campaign Completed"
                              : campaign.status === 'CANCELLED'
                                ? "Campaign Cancelled"
                                : "Not Available"
                      }
                    </Button>
                    
                    {/* Status-specific messages */}
                    {isCreator && (
                      <p className="text-xs text-gray-500 text-center">
                        Campaign creators cannot back their own projects
                      </p>
                    )}
                    
                    {!isCreator && campaign.status === 'PENDING' && (
                      <p className="text-xs text-amber-600 text-center">
                        This campaign is pending approval and cannot accept contributions yet
                      </p>
                    )}
                    
                    {!isCreator && campaign.status === 'COMPLETED' && (
                      <p className="text-xs text-blue-600 text-center">
                        This campaign has successfully reached its funding goal
                      </p>
                    )}
                    
                    {!isCreator && campaign.status === 'CANCELLED' && (
                      <p className="text-xs text-red-600 text-center">
                        This campaign has been cancelled and is no longer active
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="flex-1">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Flag className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Reward Tiers Preview */}
                  {campaign.rewardTiers && campaign.rewardTiers.length > 0 && (
                    <>
                      <div>
                        <h3 className="font-medium mb-3 flex items-center">
                          <Gift className="h-4 w-4 mr-2" />
                          Reward Tiers
                        </h3>
                        <div className="space-y-2">
                          {campaign.rewardTiers
                            .sort((a: any, b: any) => a.minimumAmount - b.minimumAmount)
                            .slice(0, 2)
                            .map((tier: any) => (
                              <div key={tier.id} className="bg-gray-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">{tier.title}</span>
                                  <span className="text-green-600 font-medium text-sm">
                                    {formatCurrency(tier.minimumAmount)}+
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {tier.description}
                                </p>
                              </div>
                            ))}
                        </div>
                        {campaign.rewardTiers.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => setSelectedTab('rewards')}
                          >
                            View All {campaign.rewardTiers.length} Rewards
                          </Button>
                        )}
                      </div>
                      
                      <Separator className="my-6" />
                    </>
                  )}

                  {/* Creator Info */}
                  <div>
                    <h3 className="font-medium mb-3">About the creator</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-medium">
                          {getCreatorName().toString().charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{getCreatorName()}</p>
                        <p className="text-sm text-gray-600">Campaign Creator</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Backing Modal */}
      <BackingModal
        isOpen={isBackingModalOpen}
        onClose={() => setIsBackingModalOpen(false)}
        campaign={campaign}
        onContributionSuccess={handleContributionSuccess}
      />
      
             {/* Milestone Modal */}
       <MilestoneModal
         isOpen={isMilestoneModalOpen}
         onClose={() => setIsMilestoneModalOpen(false)}
         onSubmit={handleSubmitMilestones}
         campaignTargetAmount={campaign?.targetAmount || 0}
         isLoading={createMilestones.isPending}
       />

      {/* Image Gallery Modal */}
      {isImageModalOpen && campaign?.additionalMedia && campaign.additionalMedia.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {campaign?.additionalMedia && campaign.additionalMedia.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <StoredImage
                storageKey={campaign?.additionalMedia?.[currentImageIndex] || ''}
                alt={`${campaign?.title} - Gallery Image ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                fallbackSrc="/placeholder.svg"
              />
            </div>

            {/* Image Counter */}
            {campaign?.additionalMedia && campaign.additionalMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {campaign.additionalMedia.length}
              </div>
            )}
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default CampaignDetails;
