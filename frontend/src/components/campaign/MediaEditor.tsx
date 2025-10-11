import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Edit2, Trash2, PlusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { uploadMultipleFiles } from "@/services/uploadService";
import StoredImage from "@/components/ui/StoredImage";

interface MediaEditorProps {
  mediaKeys: string[];
  onMediaUpdate: (newMediaKeys: string[]) => void;
  maxItems?: number;
  maxSizeMB?: number;
  title?: string;
}

const MediaEditor = ({
  mediaKeys,
  onMediaUpdate,
  maxItems = 10,
  maxSizeMB = 5,
  title = "Campaign Media"
}: MediaEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [loadedMediaKeys, setLoadedMediaKeys] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize loaded media keys when component mounts or mediaKeys changes
  useEffect(() => {
    console.log("MediaEditor: Initializing with media keys:", mediaKeys);
    setLoadedMediaKeys(mediaKeys || []);
  }, [mediaKeys]);

  const handleAddMedia = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const filesArray = Array.from(e.target.files);
    console.log("MediaEditor: Files selected:", filesArray.length);
    
    // Check if adding these files would exceed the max items
    if (loadedMediaKeys.length + filesArray.length > maxItems) {
      toast({
        title: "Too many files",
        description: `You can only upload a maximum of ${maxItems} files`,
        variant: "destructive"
      });
      return;
    }
    
    // Check file sizes
    for (const file of filesArray) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `All files must be less than ${maxSizeMB}MB`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setIsUploading(true);
      
      // Upload files and get storage keys
      const newMediaKeys = await uploadMultipleFiles(filesArray);
      console.log("MediaEditor: New media keys:", newMediaKeys);
      
      // Update the state
      const updatedKeys = [...loadedMediaKeys, ...newMediaKeys];
      setLoadedMediaKeys(updatedKeys);
      
      // Update the parent component with the new media keys
      onMediaUpdate(updatedKeys);
      
      toast({
        title: "Media added",
        description: `${filesArray.length} file(s) added successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload media",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = (index: number) => {
    const updatedMedia = [...loadedMediaKeys];
    const removedKey = updatedMedia.splice(index, 1)[0];
    console.log("MediaEditor: Removed media key:", removedKey);
    
    setLoadedMediaKeys(updatedMedia);
    onMediaUpdate(updatedMedia);
    
    toast({
      title: "Media removed",
      description: "The media item has been removed",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <span className="text-sm text-gray-500">
          {loadedMediaKeys.length} / {maxItems}
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {loadedMediaKeys.map((key, index) => (
          <div key={index} className="relative group aspect-square">
            <StoredImage
              storageKey={key}
              alt={`Media item ${index + 1}`}
              className="w-full h-full object-cover rounded-md"
              fallbackSrc="/placeholder.svg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveMedia(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {loadedMediaKeys.length < maxItems && (
          <button
            onClick={handleAddMedia}
            disabled={isUploading}
            className="border-2 border-dashed border-gray-300 rounded-md aspect-square flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin mb-1" />
                <span className="text-xs">Uploading...</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-6 w-6 mb-1" />
                <span className="text-xs">Add Media</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/mp4"
        multiple
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <p className="text-xs text-gray-500 mt-2">
        Supported formats: JPG, PNG, GIF, MP4. Max size: {maxSizeMB}MB per file.
      </p>
    </div>
  );
};

export default MediaEditor; 