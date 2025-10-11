import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchCampaignById, updateCampaign } from "@/services/campaignService";
import { useAuth } from "@/contexts/AuthContext";
import ImageEditor from "@/components/campaign/ImageEditor";
import MediaEditor from "@/components/campaign/MediaEditor";
import { safeLog } from "@/utils/debug";
import StoredImage from "@/components/ui/StoredImage";

const EditCampaign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, isAuthenticated, user } = useAuth();
  const [imageKey, setImageKey] = useState<string>("");
  const [mediaKeys, setMediaKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check where user came from
  const [cameFromBrowse, setCameFromBrowse] = useState(false);
  
  useEffect(() => {
    // Check if user came from browse
    const referrer = document.referrer;
    const searchParams = new URLSearchParams(location.search);
    const fromParam = searchParams.get('from');
    
    const isFromBrowse = fromParam === 'browse' || 
                        referrer.includes('/browse');
    
    setCameFromBrowse(isFromBrowse);
  }, [location]);

  // Fetch campaign data
  const { data: campaign, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaignById(id || ""),
    enabled: !!id
  });

  // Debug campaign data
  useEffect(() => {
    if (campaign) {
      safeLog("Campaign data in EditCampaign", campaign);
    }
  }, [campaign]);

  // Set initial image and media keys
  useEffect(() => {
    if (campaign) {
      console.log("Setting initial image key:", campaign.imageUrl);
      if (campaign.imageUrl) {
        setImageKey(campaign.imageUrl);
      }
      if (campaign.additionalMedia && Array.isArray(campaign.additionalMedia)) {
        console.log("Setting initial media keys:", campaign.additionalMedia);
        setMediaKeys(campaign.additionalMedia);
      }
    }
  }, [campaign]);

  // Check if the user is authorized to edit this campaign
  const isAuthorized = campaign && isAuthenticated && (
    campaign.creatorId === user?.id || 
    (campaign.creator && campaign.creator.id === user?.id)
  );

  // Handle image update
  const handleImageUpdate = (newImageKey: string) => {
    console.log("Image updated:", newImageKey);
    setImageKey(newImageKey);
  };

  // Handle media update
  const handleMediaUpdate = (newMediaKeys: string[]) => {
    console.log("Media updated:", newMediaKeys);
    setMediaKeys(newMediaKeys);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!id || !token) return;

    try {
      setIsSubmitting(true);

      // Only update the image and media fields
      const updateData = {
        imageUrl: imageKey,
        additionalMedia: mediaKeys
      };

      console.log("Saving campaign with data:", updateData);
      await updateCampaign(id, updateData, token);

      toast({
        title: "Changes saved",
        description: "Your campaign images have been updated successfully",
      });

      // Refetch campaign data
      await refetch();

      // Navigate back to campaign details
      navigate(`/campaign/${id}`);
    } catch (error) {
      toast({
        title: "Failed to save changes",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Navigate back to campaign details with appropriate context
    if (cameFromBrowse) {
      navigate(`/campaign/${id}?from=browse`);
    } else {
      navigate(`/campaign/${id}`);
    }
  };

  // If not authorized, redirect to campaign page
  useEffect(() => {
    if (campaign && !isLoading && !isAuthorized) {
      toast({
        title: "Unauthorized",
        description: "You are not authorized to edit this campaign",
        variant: "destructive"
      });
      navigate(`/campaign/${id}`);
    }
  }, [campaign, isLoading, isAuthorized, id, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container max-w-4xl">
          {/* Header with navigation */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaign
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">Edit Campaign Images</h1>
            <p className="text-gray-600">Update your campaign's images and media</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-gray-600">Failed to load campaign. Please try again later.</p>
            </div>
          ) : campaign ? (
            <div className="space-y-8">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Main Campaign Image</h2>
                  <p className="text-gray-600 mb-6">This is the main image that will be displayed for your campaign.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Image</h3>
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
                      <h3 className="text-lg font-medium mb-2">New Image</h3>
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
              
              <Card>
                <CardContent className="p-6">
                  <MediaEditor
                    mediaKeys={mediaKeys}
                    onMediaUpdate={handleMediaUpdate}
                    maxItems={10}
                    title="Additional Media"
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditCampaign; 