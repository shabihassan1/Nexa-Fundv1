/**
 * File System Storage Service
 * 
 * This is a mock service that simulates storing files in a file system.
 * In a real application, this would interact with a server-side API to store files.
 * 
 * For now, we'll use localStorage as a fallback but structure it to be easily
 * replaceable with actual file system storage later.
 */

import { storeImage as storeInLocalStorage, getImage as getFromLocalStorage } from './localStorageService';

// Constants
const STORAGE_PREFIX = 'nexafund_fs_';
const IMAGE_DIR = '/images/';

/**
 * Store an image in the file system
 * @param file The file to store
 * @returns A promise that resolves to the file path
 */
export const storeImage = async (file: File): Promise<string> => {
  try {
    // In a real implementation, this would upload to a server
    // For now, we'll use localStorage but return a path-like structure
    const storageKey = await storeInLocalStorage(file);
    const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const filePath = `${IMAGE_DIR}${timestamp}_${fileName}`;
    
    // Store a mapping from file path to storage key
    localStorage.setItem(`${STORAGE_PREFIX}${filePath}`, storageKey);
    
    return filePath;
  } catch (error) {
    console.error('Error storing image in file system:', error);
    throw new Error('Failed to store image');
  }
};

/**
 * Get an image from the file system
 * @param filePath The path to the image
 * @returns The image data as a string or null if not found
 */
export const getImage = (filePath: string): string | null => {
  try {
    // Get the storage key from the file path
    const storageKey = localStorage.getItem(`${STORAGE_PREFIX}${filePath}`);
    if (!storageKey) return null;
    
    // Get the image data from localStorage
    return getFromLocalStorage(storageKey);
  } catch (error) {
    console.error('Error getting image from file system:', error);
    return null;
  }
};

/**
 * Store multiple images in the file system
 * @param files Array of files to store
 * @returns A promise that resolves to an array of file paths
 */
export const storeMultipleImages = async (files: File[]): Promise<string[]> => {
  const promises = files.map(file => storeImage(file));
  return Promise.all(promises);
};

/**
 * Delete an image from the file system
 * @param filePath The path to the image
 * @returns A promise that resolves when the image is deleted
 */
export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    // Get the storage key from the file path
    const storageKey = localStorage.getItem(`${STORAGE_PREFIX}${filePath}`);
    if (storageKey) {
      // Delete the image data from localStorage
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_meta`);
    }
    
    // Delete the mapping
    localStorage.removeItem(`${STORAGE_PREFIX}${filePath}`);
  } catch (error) {
    console.error('Error deleting image from file system:', error);
  }
};

/**
 * List all images in a directory
 * @param directory The directory to list
 * @returns An array of file paths
 */
export const listImages = (directory: string = IMAGE_DIR): string[] => {
  const filePaths: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX) && key.includes(directory)) {
      filePaths.push(key.replace(STORAGE_PREFIX, ''));
    }
  }
  
  return filePaths;
}; 