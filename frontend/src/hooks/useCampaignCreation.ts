import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { createCampaign } from "@/services/campaignService";
import { safeLog } from "@/utils/debug";

interface RewardTier {
  id: string;
  title: string;
  description: string;
  minimumAmount: number;
}

interface CampaignFormData {
  title: string;
  category: string;
  description: string;
  story: string;
  goal: number;
  startDate: string;
  endDate: string;
  image: string;
  ipfsHash: string;
  additionalMedia?: string[];
  milestones?: Array<{title: string, description: string}>;
  rewardTiers?: RewardTier[];
}

export const useCampaignCreation = () => {
  const navigate = useNavigate();
  const { wallet, connect, createCampaign: createCampaignOnChain } = useWallet();
  const { token, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    category: "",
    description: "",
    story: "",
    goal: 0,
    startDate: "",
    endDate: "",
    image: "",
    ipfsHash: "",
    additionalMedia: [],
    milestones: [],
    rewardTiers: []
  });

  const nextStep = () => {
    if (activeStep === 1) {
      if (!formData.title || !formData.category || !formData.description) {
        toast({
          title: "Incomplete information",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (activeStep === 3) {
      // Validate reward tiers before proceeding
      if (formData.rewardTiers && formData.rewardTiers.length > 0) {
        const invalidTiers = formData.rewardTiers.filter(tier => 
          !tier.title.trim() || !tier.description.trim() || tier.minimumAmount <= 0
        );
        
        if (invalidTiers.length > 0) {
          toast({
            title: "Incomplete reward tiers",
            description: "Please fill in all reward tier fields with valid values",
            variant: "destructive"
          });
          return;
        }
      }
    }
    
    setActiveStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateCampaign = async () => {
    if (!wallet.connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a campaign",
        variant: "destructive"
      });
      await connect();
      return;
    }

    if (!isAuthenticated || !token) {
      toast({
        title: "Not authenticated",
        description: "Please log in to create a campaign",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      
      // Debug: Log authentication state
      console.log("Authentication state:", { isAuthenticated, tokenExists: !!token });
      
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (durationInDays <= 0) {
        throw new Error("End date must be after start date");
      }

      const { txHash } = await createCampaignOnChain({
        title: formData.title,
        description: formData.description,
        goal: formData.goal,
        duration: durationInDays,
        ipfsHash: formData.ipfsHash
      });
      
      // Ensure we're using the current token from context
      const currentToken = token;
      console.log("Using token for API request:", currentToken ? "Token exists" : "No token");
      
      // Ensure additionalMedia is an array
      const additionalMedia = Array.isArray(formData.additionalMedia) 
        ? formData.additionalMedia 
        : [];
        
      // Ensure story is a string
      const story = typeof formData.story === 'string' ? formData.story : '';
      
      // Prepare reward tiers for backend (remove temporary IDs)
      const rewardTiers = formData.rewardTiers?.filter(tier => 
        tier.title.trim() && tier.description.trim() && tier.minimumAmount > 0
      ).map(tier => ({
        title: tier.title.trim(),
        description: tier.description.trim(),
        minimumAmount: tier.minimumAmount
      })) || [];
      
      // Log data for debugging
      console.log("Additional media:", additionalMedia);
      console.log("Story content length:", story.length);
      console.log("Reward tiers:", rewardTiers);
      
      const campaignData = {
        title: formData.title,
        description: formData.description,
        story: story,
        targetAmount: formData.goal,
        category: formData.category,
        imageUrl: formData.image || "https://placehold.co/600x400?text=Campaign+Image",
        startDate: formData.startDate,
        endDate: formData.endDate,
        creatorId: wallet.address || "anonymous",
        blockchainId: txHash,
        additionalMedia: additionalMedia,
        milestones: formData.milestones || [],
        rewardTiers: rewardTiers
      };
      
      safeLog("Sending campaign data", campaignData);
      
      const result = await createCampaign(campaignData, currentToken);
      console.log("Campaign creation response:", result);
      
      toast({
        title: "Campaign created successfully",
        description: `Your campaign "${formData.title}" has been created!`,
      });
      
      navigate("/browse");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Failed to create campaign",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    activeStep,
    isLoading,
    nextStep,
    prevStep,
    handleCreateCampaign
  };
};
