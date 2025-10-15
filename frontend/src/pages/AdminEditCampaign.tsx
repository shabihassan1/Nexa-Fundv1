import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, ArrowLeft, Settings, List, Home } from "lucide-react";
import { toast } from "sonner";
import { fetchCampaignById, updateCampaign } from "@/services/campaignService";
import { useAuth } from "@/contexts/AuthContext";
import ImageEditor from "@/components/campaign/ImageEditor";
import MediaEditor from "@/components/campaign/MediaEditor";
import StoredImage from "@/components/ui/StoredImage";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/data/campaigns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminEditCampaign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    story: "",
    category: "",
    targetAmount: "",
    startDate: "",
    endDate: "",
    status: "PENDING"
  });
  
  const [imageKey, setImageKey] = useState<string>("");
  const [mediaKeys, setMediaKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin or super admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch campaign data
  const { data: campaign, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaignById(id || ""),
    enabled: !!id
  });

  // Populate form with campaign data
  useEffect(() => {
    if (campaign) {
      setFormData({
        title: campaign.title || "",
        description: campaign.description || "",
        story: campaign.story || "",
        category: campaign.category || "",
        targetAmount: campaign.targetAmount?.toString() || "",
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : "",
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : "",
        status: campaign.status || "PENDING"
      });
      
      if (campaign.imageUrl) {
        setImageKey(campaign.imageUrl);
      }
      
      if (campaign.additionalMedia && Array.isArray(campaign.additionalMedia)) {
        setMediaKeys(campaign.additionalMedia);
      }
    }
  }, [campaign]);

  // If not admin, redirect
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      toast.error("You don't have permission to access this page");
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image update
  const handleImageUpdate = (newImageKey: string) => {
    setImageKey(newImageKey);
  };

  // Handle media update
  const handleMediaUpdate = (newMediaKeys: string[]) => {
    setMediaKeys(newMediaKeys);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!id || !token) return;

    try {
      setIsSubmitting(true);

      // Prepare update data
      const updateData = {
        title: formData.title,
        description: formData.description,
        story: formData.story,
        category: formData.category,
        targetAmount: parseFloat(formData.targetAmount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        imageUrl: imageKey,
        additionalMedia: mediaKeys
      };

      await updateCampaign(id, updateData, token);

      toast.success("Campaign updated successfully");
      
      // Refetch campaign data
      await refetch();

      // Navigate back to campaign details
      navigate(`/campaign/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/campaign/${id}`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error || !campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Campaign not found</h2>
            <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/admin")}>Back to Admin Panel</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusOptions = [
    { value: "PENDING", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "APPROVED", label: "Approved", color: "bg-blue-100 text-blue-800" },
    { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
    { value: "PAUSED", label: "Paused", color: "bg-gray-100 text-gray-800" },
    { value: "COMPLETED", label: "Completed", color: "bg-purple-100 text-purple-800" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-red-100 text-red-800" },
    { value: "FLAGGED", label: "Flagged", color: "bg-orange-100 text-orange-800" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Campaign
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/admin/campaigns')}
                className="flex items-center"
              >
                <List className="h-4 w-4 mr-2" />
                Campaign Management
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
                className="flex items-center"
              >
                <Home className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <Settings className="h-8 w-8 mr-3 text-blue-600" />
                  Admin: Edit Campaign
                </h1>
                <p className="text-gray-600">
                  Edit all aspects of "{campaign.title}" as an administrator
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge className="bg-blue-100 text-blue-800">
                  Admin Access
                </Badge>
                <Badge className={statusOptions.find(s => s.value === formData.status)?.color}>
                  {statusOptions.find(s => s.value === formData.status)?.label}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Campaign title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief campaign description"
                    rows={3}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== "All Categories").map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount ($)
                  </label>
                  <Input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dates and Status */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Status
                  </label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${status.color.split(' ')[0]}`}></div>
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campaign info */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Campaign Info</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Creator: {campaign.creator?.name || 'Unknown'}</div>
                    <div>Current Amount: ${campaign.currentAmount?.toLocaleString() || '0'}</div>
                    <div>Contributors: {campaign._count?.contributions || 0}</div>
                    <div>Created: {new Date(campaign.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Story */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Campaign Story</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="story"
                  name="story"
                  value={formData.story}
                  onChange={handleInputChange}
                  placeholder="Tell the full story of this campaign..."
                  rows={8}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Main Campaign Image */}
            <Card>
              <CardHeader>
                <CardTitle>Main Campaign Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Current Image</h4>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <StoredImage
                        storageKey={campaign.imageUrl || ""}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholder.svg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Update Image</h4>
                    <ImageEditor
                      imageKey={imageKey}
                      onImageUpdate={handleImageUpdate}
                      aspectRatio="wide"
                      title="Update Main Image"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Media */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Media</CardTitle>
              </CardHeader>
              <CardContent>
                <MediaEditor
                  mediaKeys={mediaKeys}
                  onMediaUpdate={handleMediaUpdate}
                  maxItems={10}
                  title="Additional Campaign Media"
                />
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSaveChanges}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save All Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminEditCampaign; 