/**
 * Generates a unique ID for an image.
 */
export const generateImageId = (): string => {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}; 