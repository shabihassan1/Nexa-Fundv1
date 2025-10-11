import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/config";

interface StoredImageProps {
  storageKey: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Component for displaying an image from a URL.
 * Handles loading and error states.
 */
const StoredImage = ({
  storageKey,
  alt,
  className = "",
  fallbackSrc = "/placeholder.svg",
}: StoredImageProps) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    let finalUrl = '';
    if (storageKey) {
      if (storageKey.startsWith('http')) {
        finalUrl = storageKey;
      } else {
        const uploadIndex = storageKey.indexOf('/uploads/');
        if (uploadIndex !== -1) {
          finalUrl = `${API_BASE_URL}${storageKey.substring(uploadIndex)}`;
        }
      }
    }
    
    if (finalUrl) {
      setImageUrl(finalUrl);
      setStatus('loading');
    } else {
      setStatus('error');
    }
  }, [storageKey]);

  if (status === 'error' || !storageKey) {
    return <img src={fallbackSrc} alt={alt} className={className} />;
  }

  return (
    <div className={`relative ${className}`}>
      {status === 'loading' && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default StoredImage; 