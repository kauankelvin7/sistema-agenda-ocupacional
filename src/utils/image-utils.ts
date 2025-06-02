
/**
 * Utility functions for image processing and optimization
 */

export interface ImageResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const DEFAULT_RESIZE_OPTIONS: ImageResizeOptions = {
  maxWidth: 80,
  maxHeight: 80,
  quality: 0.8
};

/**
 * Resizes an image file to specified dimensions
 * @param file The image file to resize
 * @param options Resize options
 * @returns Promise with the resized image as base64 string
 */
export const resizeImage = (
  file: File, 
  options: ImageResizeOptions = DEFAULT_RESIZE_OPTIONS
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const { maxWidth, maxHeight } = options;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and resize image
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with specified quality
        const resizedImageUrl = canvas.toDataURL('image/jpeg', options.quality);
        resolve(resizedImageUrl);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL for the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Validates if file is a valid image
 * @param file File to validate
 * @returns boolean indicating if file is valid
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize;
};

/**
 * Gets initials from display name for fallback
 * @param displayName User's display name
 * @returns Initials string
 */
export const getInitials = (displayName: string): string => {
  if (!displayName) return "U";
  
  return displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};
