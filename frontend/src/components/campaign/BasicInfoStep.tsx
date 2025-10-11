import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/data/campaigns";
import { generateMockIPFSHash } from "@/services/uploadService";
import ImageEditor from "@/components/ui/ImageEditor";

interface BasicInfoStepProps {
  formData: {
    title: string;
    category: string;
    description: string;
    image: string;
    ipfsHash: string;
  };
  setFormData: (data: any) => void;
}

const BasicInfoStep = ({ formData, setFormData }: BasicInfoStepProps) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleImageUpdate = (imageUrl: string | null) => {
    setFormData((prev: any) => ({
      ...prev,
      image: imageUrl,
      // Generate a mock IPFS hash for now, this would be a real hash from IPFS in production
      ipfsHash: imageUrl ? generateMockIPFSHash(imageUrl) : '',
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Campaign Basics</h2>
      <p className="text-gray-600 mb-6">Let's start with the fundamental details of your campaign.</p>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Title*
          </label>
          <Input 
            id="title" 
            placeholder="What's your campaign called?" 
            value={formData.title}
            onChange={handleInputChange}
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category*
          </label>
          <select 
            id="category"
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="" disabled>Select a category</option>
            {categories.filter(c => c !== "All Categories").map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Short Description*
          </label>
          <Textarea 
            id="description" 
            placeholder="Summarize your campaign in a short sentence"
            className="resize-none"
            rows={2}
            value={formData.description}
            onChange={handleInputChange}
          />
          <p className="mt-1 text-xs text-gray-500">
            Keep it clear, specific and compelling. 100 characters or less.
          </p>
        </div>
        
        <ImageEditor
          label="Campaign Image*"
          currentImage={formData.image}
          onImageChange={handleImageUpdate}
        />
      </div>
    </div>
  );
};

export default BasicInfoStep;
