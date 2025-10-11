import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { uploadMultipleFiles } from "@/services/uploadService";
import StoredImage from "@/components/ui/StoredImage";

interface StoryStepProps {
  formData: {
    story: string;
    additionalMedia?: string[];
  };
  setFormData: (data: any) => void;
}

const StoryStep = ({ formData, setFormData }: StoryStepProps) => {
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>(formData.additionalMedia || []);

  useEffect(() => {
    // When the form data is loaded externally, update the state
    if (formData.additionalMedia) {
      setMediaUrls(formData.additionalMedia);
    }
  }, [formData.additionalMedia]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    try {
      setUploadingMedia(true);
      const filesArray = Array.from(e.target.files);
      const newMediaUrls = await uploadMultipleFiles(filesArray);
      
      const updatedMedia = [...mediaUrls, ...newMediaUrls];
      setMediaUrls(updatedMedia);
      setFormData((prev: any) => ({ ...prev, additionalMedia: updatedMedia }));
      
      toast({
        title: "Media added",
        description: `${filesArray.length} file(s) added successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index: number) => {
    const updatedMedia = [...mediaUrls];
    updatedMedia.splice(index, 1);
    
    setMediaUrls(updatedMedia);
    setFormData((prev: any) => ({ ...prev, additionalMedia: updatedMedia }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Campaign Story</h2>
      <p className="text-gray-600 mb-6">Tell potential backers about your project and why it matters.</p>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="story" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Story*
          </label>
          <Textarea 
            id="story"
            placeholder="Share your story..."
            rows={8}
            value={formData.story}
            onChange={handleInputChange}
          />
          <p className="mt-1 text-xs text-gray-500">
            Explain what you're raising funds for and why people should contribute.
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Media (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {mediaUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <StoredImage 
                      storageKey={url}
                      alt={`Additional media ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button 
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-center">
              <p className="text-gray-600 mb-2">Upload videos or additional images</p>
              <p className="text-xs text-gray-500 mb-4">Supported formats: JPG, PNG, GIF</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('media-upload')?.click()}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Add Media
                  </>
                )}
              </Button>
              <input 
                type="file" 
                id="media-upload" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={handleMediaUpload}
                disabled={uploadingMedia}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryStep;
