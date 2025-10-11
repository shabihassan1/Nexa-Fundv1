// uploadService now uses only the backend uploads; removed localStorage imports

import { API_URL, API_BASE_URL } from "@/config";

/**
 * Uploads an image file to the backend and returns the server-based URL.
 */
export const uploadImage = async (file: File): Promise<string> => {
  // Check file size (max 10MB as defined on backend)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File size exceeds 10MB limit");
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    throw new Error("File must be an image");
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_URL}/uploads`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const { url } = await response.json();
    // The backend returns a relative URL like "/uploads/filename.jpg"
    // We need the full URL for the <img src>
    return `${API_BASE_URL}${url}`;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to upload image");
  }
};

/**
 * Uploads multiple files by calling uploadImage for each.
 */
export const uploadMultipleFiles = async (files: File[]): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadImage(file));
  return Promise.all(uploadPromises);
};

/**
 * Kept for compatibility but should be deprecated.
 * In a real application, this would upload to IPFS.
 */
export const generateMockIPFSHash = (fileName: string): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let hash = 'Qm';
  for (let i = 0; i < 44; i++) {
    hash += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return hash;
}; 