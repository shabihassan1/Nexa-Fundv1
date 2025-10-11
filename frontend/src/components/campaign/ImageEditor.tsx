import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Edit2, Trash2, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { uploadImage } from "@/services/uploadService";
import StoredImage from "@/components/ui/StoredImage";

interface ImageEditorProps {
  imageKey: string;
  onImageUpdate: (newImageKey: string) => void;
  onCancel?: () => void;
  aspectRatio?: "square" | "wide" | "tall";
  maxSizeMB?: number;
  title?: string;
}

const ImageEditor = ({
  imageKey,
  onImageUpdate,
  onCancel,
  aspectRatio = "wide",
  maxSizeMB = 5,
  title = "Edit Image"
}: ImageEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial image
  useEffect(() => {
    if (imageKey) {
      // imageKey is now a URL or relative path; use it directly
      setPreviewUrl(imageKey);
    }
  }, [imageKey]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Image must be less than ${maxSizeMB}MB`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload image and get storage key
      const newImageKey = await uploadImage(file);
      console.log("ImageEditor: New image uploaded with key:", newImageKey);
      
      // newImageKey is a full URL; set preview directly
      setPreviewUrl(newImageKey);
      
      // Update the parent component with the new image key
      onImageUpdate(newImageKey);
      
      toast({
        title: "Image updated",
        description: "Your image has been updated successfully",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Get aspect ratio class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "tall":
        return "aspect-[3/4]";
      case "wide":
      default:
        return "aspect-video";
    }
  };

  return (
    <div className="relative">
      <div className={`${getAspectRatioClass()} overflow-hidden rounded-lg`}>
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <StoredImage
            storageKey={imageKey}
            alt="Campaign image"
            className="w-full h-full object-cover"
            fallbackSrc="/placeholder.svg"
          />
        )}
      </div>
      
      {!isEditing ? (
        <Button
          variant="outline"
          size="sm"
          className="absolute top-2 right-2 bg-white bg-opacity-70 hover:bg-white"
          onClick={handleEditClick}
        >
          <Edit2 className="h-4 w-4 mr-1" /> Edit
        </Button>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="p-4 bg-white rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-2">{title}</h3>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleFileSelect}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Choose Image
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageEditor; 