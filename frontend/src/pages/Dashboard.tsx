import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  BarChart3,
  Heart,
  Target,
  Clock,
  Activity,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCampaigns } from "@/services/campaignService";
import { Skeleton } from "@/components/ui/skeleton";
import CampaignCard from "@/components/CampaignCard";
import { fetchUserActivities, getActivityIcon, getActivityColor, type Activity as ActivityType } from "@/services/activityService";
import { API_URL } from "@/config";

const Dashboard = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['user-campaigns', user?.id],
    queryFn: () => fetchCampaigns({ creatorId: user?.id }),
    enabled: !!user?.id && isAuthenticated
  });

  // Fetch campaigns user has backed (contributions)
  const { data: backedCampaigns, isLoading: backedLoading } = useQuery({
    queryKey: ['backed-campaigns', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/contributions/user/${user?.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch backed campaigns');
      return response.json();
    },
    enabled: !!user?.id && !!token && isAuthenticated
  });

  // Fetch user activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['user-activities', user?.id],
    queryFn: () => fetchUserActivities(user?.id!, token!),
    enabled: !!user?.id && !!token && isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const userCampaigns = campaignsData?.campaigns || [];

  // Calculate statistics
  const stats = {
    totalCampaigns: userCampaigns.length,
    totalRaised: userCampaigns.reduce((sum, campaign) => sum + (campaign.currentAmount || 0), 0),
    totalBackers: userCampaigns.reduce((sum, campaign) => sum + (campaign._count?.contributions || 0), 0),
    activeCampaigns: userCampaigns.filter(campaign => campaign.status === 'ACTIVE').length
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-8">Please log in to view your dashboard.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 py-8">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-600">Manage your campaigns and track your progress</p>
              </div>
              <Link to="/start-campaign">
                <Button className="bg-green-500 hover:bg-green-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="container py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
              <TabsTrigger value="backed">Backed Projects</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                        <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                      </div>
                      <Target className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Raised</p>
                        <p className="text-2xl font-bold">{formatCurrency(stats.totalRaised)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Backers</p>
                        <p className="text-2xl font-bold">{stats.totalBackers}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                        <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity and Campaigns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-3">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-3 w-2/3" />
                              <Skeleton className="h-2 w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activities && activities.length > 0 ? (
                      <div className="space-y-3">
                        {activities.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 text-sm">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getActivityColor(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 truncate">{activity.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setActiveTab("analytics")}
                          >
                            View All Activity
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Campaigns */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Campaigns</CardTitle>
                  </CardHeader>
                  <CardContent>
                  {campaignsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-16 w-16 rounded" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userCampaigns.length > 0 ? (
                    <div className="space-y-4">
                      {userCampaigns.slice(0, 5).map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <img 
                              src={campaign.imageUrl || "/placeholder.svg"} 
                              alt={campaign.title}
                              className="h-16 w-16 rounded object-cover"
                            />
                            <div>
                              <h4 className="font-medium">{campaign.title}</h4>
                              <p className="text-sm text-gray-600">{campaign.category}</p>
                              <Badge className={getStatusColor(campaign.status)}>
                                {campaign.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(campaign.currentAmount || 0)}</p>
                            <p className="text-sm text-gray-600">
                              of {formatCurrency(campaign.targetAmount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                      <p className="text-gray-600 mb-4">Start your first campaign to see it here</p>
                      <Link to="/start-campaign">
                        <Button className="bg-green-500 hover:bg-green-600">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Campaign
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* My Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Campaigns</h2>
                <Link to="/start-campaign">
                  <Button className="bg-green-500 hover:bg-green-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Campaign
                  </Button>
                </Link>
              </div>

              {campaignsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="w-full h-48 rounded-lg" />
                      <Skeleton className="w-2/3 h-4 rounded" />
                      <Skeleton className="w-full h-3 rounded" />
                    </div>
                  ))}
                </div>
              ) : userCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userCampaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No campaigns yet</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't created any campaigns yet. Start your first campaign to begin raising funds for your project.
                    </p>
                    <Link to="/start-campaign">
                      <Button className="bg-green-500 hover:bg-green-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Campaign
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Backed Projects Tab */}
            <TabsContent value="backed" className="space-y-6">
              <h2 className="text-2xl font-bold">Backed Projects</h2>
              
              {backedLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="w-full h-48 rounded-lg" />
                      <Skeleton className="w-2/3 h-4 rounded" />
                      <Skeleton className="w-full h-3 rounded" />
                    </div>
                  ))}
                </div>
              ) : backedCampaigns && backedCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {backedCampaigns.map((contribution: any) => (
                    <Card key={contribution.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-green-100 text-green-800">
                            Backed {formatCurrency(contribution.amount)}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(contribution.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-medium mb-2">{contribution.campaign?.title}</h4>
                        <p className="text-sm text-gray-600 mb-4">{contribution.campaign?.description}</p>
                        <Link to={`/campaign/${contribution.campaign?.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Campaign
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No backed projects yet</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't backed any projects yet. Explore campaigns and support projects you believe in.
                    </p>
                    <Link to="/browse">
                      <Button className="bg-green-500 hover:bg-green-600">
                        Explore Campaigns
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-2xl font-bold">Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Campaign Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userCampaigns.length > 0 ? (
                      <div className="space-y-4">
                        {userCampaigns.map((campaign) => {
                          const progress = Math.min(Math.round(((campaign.currentAmount || 0) / (campaign.targetAmount || 1)) * 100), 100);
                          return (
                            <div key={campaign.id} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{campaign.title}</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>{formatCurrency(campaign.currentAmount || 0)}</span>
                                <span>{formatCurrency(campaign.targetAmount)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No campaign data to display</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activitiesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-start space-x-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : activities && activities.length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {activities.slice(0, 10).map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                              <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">
                                  {new Date(activity.timestamp).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                {activity.relatedId && activity.relatedType === 'campaign' && (
                                  <Link 
                                    to={`/campaign/${activity.relatedId}`}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    View <ExternalLink className="h-3 w-3" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {activities.length > 10 && (
                          <div className="text-center pt-4 border-t">
                            <p className="text-sm text-gray-500">
                              Showing 10 of {activities.length} activities
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start creating campaigns or backing projects to see your activity here
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Link to="/start-campaign">
                            <Button size="sm" className="bg-green-500 hover:bg-green-600">
                              Create Campaign
                            </Button>
                          </Link>
                          <Link to="/browse">
                            <Button size="sm" variant="outline">
                              Browse Projects
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard; 