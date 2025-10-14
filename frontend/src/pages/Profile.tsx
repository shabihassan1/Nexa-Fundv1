import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Wallet, 
  Edit2, 
  Save, 
  X, 
  Shield,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { API_URL } from "@/config";

const Profile = () => {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: ''
  });

  // Fetch user profile data
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getCurrentUser(token!),
    enabled: !!token && isAuthenticated
  });

  // Update form data when profile data is loaded or user context changes
  useEffect(() => {
    const userData = profileData || user;
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        bio: userData.bio || ''
      });
    }
  }, [profileData, user]);

  // Invalidate profile query when user context changes (e.g., after wallet disconnect)
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  }, [user?.walletAddress, queryClient]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        bio: profileData.bio || ''
      });
    }
    setIsEditing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-8">Please log in to view your profile.</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 py-8">
            <div className="container">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-6 w-64" />
            </div>
          </div>
          <div className="container py-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                      <Skeleton className="h-6 w-32 mx-auto mb-2" />
                      <Skeleton className="h-4 w-48 mx-auto" />
                    </CardContent>
                  </Card>
                </div>
                <div className="lg:col-span-2">
                  <Card>
                    <CardContent className="p-6">
                      <Skeleton className="h-8 w-48 mb-6" />
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
          <p className="mb-8">There was an error loading your profile. Please try again later.</p>
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
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
              </div>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} className="bg-green-500 hover:bg-green-600">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Summary Card */}
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {(profileData || user)?.name || 'Anonymous User'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {(profileData || user)?.email || 'No email provided'}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <Badge variant={(profileData || user)?.isVerified ? "default" : "secondary"}>
                          {(profileData || user)?.isVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Joined {(profileData || user)?.createdAt ? new Date((profileData || user).createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Wallet className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {(profileData || user)?.walletAddress ? 
                            `${(profileData || user).walletAddress.slice(0, 6)}...${(profileData || user).walletAddress.slice(-4)}` : 
                            'No wallet connected'
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Details Card */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Profile Information
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSave} 
                            disabled={updateProfileMutation.isPending}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button 
                            onClick={handleCancel} 
                            variant="outline"
                            disabled={updateProfileMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                          {profileData?.name || 'Not provided'}
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email address"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                          {profileData?.email || 'Not provided'}
                        </p>
                      )}
                    </div>

                    {/* Bio Field */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="flex items-center gap-2">
                        <Edit2 className="h-4 w-4" />
                        Bio
                      </Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-md min-h-[100px]">
                          {profileData?.bio || 'No bio provided'}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Wallet Information */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Wallet Address
                      </Label>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-mono text-sm break-all">
                          {(profileData || user)?.walletAddress || 'No wallet connected'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate('/preferences')}
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <svg 
                      className="h-5 w-5 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" 
                      />
                    </svg>
                    Manage Personalization Preferences
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Set your interests to get personalized campaign recommendations
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile; 