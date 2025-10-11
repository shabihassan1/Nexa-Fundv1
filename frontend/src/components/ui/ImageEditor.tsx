import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import StoredImage from '@/components/ui/StoredImage';
import { uploadImage } from '@/services/uploadService';
import { Loader2, UploadCloud, X, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ImageEditorProps {
  label: string;
  currentImage: string | null;
  onImageChange: (imageUrl: string | null) => void;
}

const ImageEditor = ({ label, currentImage, onImageChange }: ImageEditorProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const newImageUrl = await uploadImage(file);
      onImageChange(newImageUrl);
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred';
      setError(errorMessage);
      toast({ title: 'Upload Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      // Reset file input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setError(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden">
        {currentImage ? (
          <>
            <StoredImage
              storageKey={currentImage}
              alt="Uploaded Image"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={handleRemoveImage}
              >
                <X size={16} />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <UploadCloud size={32} className="mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-white" />
            <p className="mt-2 text-white">Uploading...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center text-red-600">
          <AlertCircle size={16} className="mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
        disabled={isUploading}
      />
      
      <Button
        variant="outline"
        onClick={triggerFileSelect}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Choose Image'}
      </Button>
    </div>
  );
};

export default ImageEditor; 