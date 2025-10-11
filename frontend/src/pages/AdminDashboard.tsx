import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  BarChart3 
} from "lucide-react";

const AdminDashboard = () => {
  const { isAdmin, isModerator } = usePermissions();
  const queryClient = useQueryClient();
  
  if (!isAdmin() && !isModerator()) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  // Fetch pending campaigns
  const { data: pendingCampaigns } = useQuery({
    queryKey: ['pending-campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.json();
    }
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await fetch('/api/users/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.json();
    },
    enabled: isAdmin()
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 py-8">
          <div className="container">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage platform operations and content</p>
          </div>
        </div>

        <div className="container py-8">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="campaigns">Campaign Approval</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Campaigns</p>
                        <p className="text-2xl font-bold">{pendingCampaigns?.length || 0}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold">{userStats?.totalUsers || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Verified Users</p>
                        <p className="text-2xl font-bold">{userStats?.verifiedUsers || 0}</p>
                      </div>
                      <Shield className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                        <p className="text-2xl font-bold">0</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Campaign Approval Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Pending Campaign Approvals</h2>
              </div>

              {pendingCampaigns && pendingCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {pendingCampaigns.map((campaign: any) => (
                    <Card key={campaign.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{campaign.title}</h3>
                            <p className="text-gray-600 mb-2">{campaign.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Creator: {campaign.creator.name || 'Anonymous'}</span>
                              <span>Target: ${campaign.targetAmount.toLocaleString()}</span>
                              <Badge variant={campaign.creator.isVerified ? "default" : "secondary"}>
                                {campaign.creator.isVerified ? "Verified" : "Unverified"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => approveCampaign(campaign.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rejectCampaign(campaign.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">All caught up!</h3>
                    <p className="text-gray-600">No campaigns pending approval.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">User Management</h2>
              </div>
              
              {/* User management content */}
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-600">User management interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Platform Analytics</h2>
              </div>
              
              {/* Analytics content */}
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-600">Analytics dashboard coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard; 