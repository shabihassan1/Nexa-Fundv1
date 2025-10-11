import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface RewardTier {
  id: string;
  title: string;
  description: string;
  minimumAmount: number;
}

interface FundingStepProps {
  formData: {
    goal: number;
    startDate: string;
    endDate: string;
    rewardTiers?: RewardTier[];
  };
  setFormData: (data: any) => void;
}

const FundingStep = ({ formData, setFormData }: FundingStepProps) => {
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>(
    formData.rewardTiers || [
      {
        id: '1',
        title: '',
        description: '',
        minimumAmount: 0
      }
    ]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleRewardTierChange = (id: string, field: keyof RewardTier, value: string | number) => {
    const updatedTiers = rewardTiers.map(tier => 
      tier.id === id ? { ...tier, [field]: value } : tier
    );
    setRewardTiers(updatedTiers);
    setFormData((prev: any) => ({
      ...prev,
      rewardTiers: updatedTiers
    }));
  };

  const addRewardTier = () => {
    const newTier: RewardTier = {
      id: Date.now().toString(),
      title: '',
      description: '',
      minimumAmount: 0
    };
    const updatedTiers = [...rewardTiers, newTier];
    setRewardTiers(updatedTiers);
    setFormData((prev: any) => ({
      ...prev,
      rewardTiers: updatedTiers
    }));
  };

  const removeRewardTier = (id: string) => {
    if (rewardTiers.length <= 1) return; // Keep at least one tier
    const updatedTiers = rewardTiers.filter(tier => tier.id !== id);
    setRewardTiers(updatedTiers);
    setFormData((prev: any) => ({
      ...prev,
      rewardTiers: updatedTiers
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Funding Details</h2>
      <p className="text-gray-600 mb-6">Set your funding goal and timeline for the campaign.</p>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
            Funding Goal*
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <Input 
              id="goal" 
              type="number" 
              placeholder="5000" 
              className="pl-8" 
              value={formData.goal || ''}
              onChange={handleInputChange}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Set a realistic goal based on your project's needs.
          </p>
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Duration*
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">
                Start Date
              </label>
              <Input 
                id="startDate" 
                type="date" 
                value={formData.startDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">
                End Date
              </label>
              <Input 
                id="endDate" 
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Most successful campaigns run for 30 days or less.
          </p>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-medium mb-2">Reward Tiers</h3>
          <p className="text-gray-600 text-sm mb-4">
            Define what backers will receive in exchange for their support.
          </p>
          
          {rewardTiers.map((tier, index) => (
            <div key={tier.id} className="bg-gray-50 p-4 rounded-lg mb-4 relative">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Reward Tier #{index + 1}</h4>
                {rewardTiers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRewardTier(tier.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Tier Name*
                  </label>
                  <Input 
                    placeholder="Early Bird" 
                    value={tier.title}
                    onChange={(e) => handleRewardTierChange(tier.id, 'title', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Minimum Amount*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <Input 
                      type="number" 
                      placeholder="25" 
                      className="pl-8"
                      value={tier.minimumAmount || ''}
                      onChange={(e) => handleRewardTierChange(tier.id, 'minimumAmount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Description*
                </label>
                <Textarea 
                  placeholder="What will backers receive?" 
                  rows={2}
                  value={tier.description}
                  onChange={(e) => handleRewardTierChange(tier.id, 'description', e.target.value)}
                />
              </div>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={addRewardTier}
            type="button"
          >
            + Add Another Reward Tier
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FundingStep;
