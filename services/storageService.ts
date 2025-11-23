import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'shop-images';

/**
 * Upload an image to Supabase Storage
 * @param file - The image file to upload
 * @param folder - Optional folder name (e.g., 'shops', 'profiles')
 * @returns The public URL of the uploaded image
 */
export const uploadImage = async (
  file: File,
  folder: string = 'shops'
): Promise<{ success: boolean; url?: string; error?: any }> => {
  console.log('uploadImage called for file:', file.name, 'size:', file.size);
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file type. Please upload an image (JPG, PNG, WebP, or GIF)'
    };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      success: false,
      error: 'File too large. Maximum size is 5MB'
    };
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  console.log('Uploading to:', fileName);

  try {
    // Upload to Supabase Storage with timeout
    const uploadPromise = supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    // Add 120 second timeout (2 minutes - allows for large images and slower connections)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 120s - check your internet connection and Supabase storage settings')), 120000)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    console.log('Upload response - data:', data, 'error:', error);

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('Public URL generated:', publicUrl);

    return {
      success: true,
      url: publicUrl
    };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    // More specific error messages
    let errorMessage = error.message || 'Failed to upload image';
    
    if (errorMessage.includes('timeout')) {
      errorMessage = 'Upload timed out. This may be due to:\n• Slow internet connection\n• Large image file\n• Supabase storage not configured\n• Missing "shop-images" bucket in Supabase Storage';
    } else if (errorMessage.includes('CORS')) {
      errorMessage = 'CORS error. Add your domain to allowed origins in Supabase Storage settings.';
    } else if (errorMessage.includes('bucket') || errorMessage.includes('not found')) {
      errorMessage = 'Storage bucket "shop-images" not found. Please create it in your Supabase project (Storage > New Bucket > "shop-images" with Public access).';
    } else if (errorMessage.includes('not configured')) {
      errorMessage = 'Supabase Storage is not configured. Check your .env file and Supabase project settings.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Upload multiple images
 */
export const uploadImages = async (
  files: File[],
  folder: string = 'shops'
): Promise<{ success: boolean; urls?: string[]; error?: any }> => {
  try {
    console.log(`Starting upload of ${files.length} files...`);
    
    const uploadPromises = files.map(file => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);

    console.log('All upload results:', results);

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.error('Failed uploads:', failed);
      return {
        success: false,
        error: failed[0].error || `${failed.length} image(s) failed to upload`
      };
    }

    const urls = results.map(r => r.url).filter(Boolean) as string[];
    console.log('Successfully uploaded URLs:', urls);
    
    return {
      success: true,
      urls
    };
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload images'
    };
  }
};

/**
 * Delete an image from storage
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1].split('?')[0]; // Remove query params

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Create the storage bucket if it doesn't exist
 * This should be run once during setup
 */
export const initializeStorage = async () => {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    
    if (error && error.message.includes('not found')) {
      // Bucket doesn't exist, create it
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) throw createError;
      console.log('Storage bucket created successfully');
      return true;
    }

    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};
