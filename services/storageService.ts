import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'shop-images';

/**
 * Convert HEIC/HEIF image to JPEG
 * @param file - The HEIC/HEIF file to convert
 * @returns A JPEG file or the original file if conversion fails
 */
const convertHEICtoJPEG = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        
        // Convert to JPEG blob
        canvas.toBlob((blob) => {
          if (blob) {
            const convertedFile = new File(
              [blob], 
              file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
              { type: 'image/jpeg' }
            );
            resolve(convertedFile);
          } else {
            resolve(file); // Fallback to original
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => resolve(file); // Fallback to original
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => resolve(file); // Fallback to original
    reader.readAsDataURL(file);
  });
};

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
  console.log('uploadImage called for file:', file.name, 'size:', file.size, 'type:', file.type);
  
  // Handle HEIC/HEIF files - convert to JPEG
  let processedFile = file;
  if (file.type === 'image/heic' || file.type === 'image/heif' || 
      file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
    console.log('HEIC/HEIF detected, converting to JPEG...');
    processedFile = await convertHEICtoJPEG(file);
    console.log('Converted to:', processedFile.type, processedFile.size);
  }
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(processedFile.type)) {
    return {
      success: false,
      error: `Invalid file type: ${processedFile.type}. Please upload an image (JPG, PNG, WebP, or GIF). HEIC/HEIF images from iPhone are automatically converted.`
    };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (processedFile.size > maxSize) {
    return {
      success: false,
      error: 'File too large. Maximum size is 5MB'
    };
  }

  // Generate unique filename
  const fileExt = processedFile.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  console.log('Uploading to:', fileName);

  try {
    // Check if user is authenticated and refresh if needed
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No active session found for upload');
      return {
        success: false,
        error: 'Your session has expired. Please log out and log back in to continue.'
      };
    }
    
    // Check if token is about to expire and refresh if needed
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    
    if (expiresAt < now) {
      console.log('Session expired, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        console.error('Failed to refresh session:', refreshError);
        return {
          success: false,
          error: 'Your session has expired. Please log out and log back in to continue uploading.'
        };
      }
      
      session = refreshedSession;
      console.log('Session refreshed successfully');
    }
    
    console.log('User authenticated, session valid until:', new Date(expiresAt));

    // First, check if bucket exists
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME);
    
    if (bucketError || !bucketData) {
      console.error('Bucket check failed:', bucketError);
      return {
        success: false,
        error: `Storage bucket "${BUCKET_NAME}" not found. Please run STORAGE_FIX.sql in your Supabase SQL Editor.`
      };
    }

    console.log('Bucket exists, proceeding with upload...');

    // Upload to Supabase Storage with timeout
    const uploadPromise = supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false
      });

    // Add 30 second timeout - if it takes longer, there's a real issue
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 30s - check Supabase storage configuration and internet connection')), 30000)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    console.log('Upload response - data:', data, 'error:', error);

    if (error) {
      console.error('Upload error:', error);
      
      // Provide specific error messages
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        return {
          success: false,
          error: 'Storage upload blocked by security policy. Please run STORAGE_FIX.sql in your Supabase SQL Editor to fix permissions.'
        };
      }
      
      if (error.message?.includes('JWT') || error.message?.includes('expired')) {
        return {
          success: false,
          error: 'Session expired. Please log out and log back in, then try again.'
        };
      }
      
      if (error.message?.includes('not found')) {
        return {
          success: false,
          error: `Bucket "${BUCKET_NAME}" not found. Run STORAGE_FIX.sql in Supabase SQL Editor.`
        };
      }
      
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
      errorMessage = 'Upload timed out after 30s. Possible causes:\n• Supabase storage bucket not configured correctly\n• Storage RLS policies blocking uploads\n• Network connectivity issues\n\nPlease check STORAGE_SETUP.md for configuration steps.';
    } else if (errorMessage.includes('not found')) {
      errorMessage = `Storage bucket "${BUCKET_NAME}" not found. Please:\n1. Go to Supabase Dashboard > Storage\n2. Create bucket named "${BUCKET_NAME}"\n3. Enable "Public bucket"\n4. Add RLS policies for authenticated uploads`;
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
 * Verify the storage bucket exists (does NOT auto-create)
 * This should be run once during app initialization
 */
export const initializeStorage = async (): Promise<boolean> => {
  try {
    console.log(`Verifying storage bucket "${BUCKET_NAME}" exists...`);
    
    // List all buckets to check if ours exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Cannot access storage:', listError.message);
      return false;
    }

    const bucketExists = buckets?.some(b => b.id === BUCKET_NAME);
    
    if (!bucketExists) {
      console.error(`❌ Bucket "${BUCKET_NAME}" not found in production!`);
      console.warn(`⚠️ Please create the "${BUCKET_NAME}" bucket in Supabase Dashboard:`);
      console.warn('1. Go to https://supabase.com/dashboard/project/zxetnactllyzslievgxj/storage');
      console.warn('2. Click "New Bucket"');
      console.warn(`3. Name: "${BUCKET_NAME}"`);
      console.warn('4. Enable "Public bucket" ✅');
      console.warn('5. Set file size limit to 5MB (5242880 bytes)');
      return false;
    }

    console.log(`✅ Storage bucket "${BUCKET_NAME}" verified and accessible`);
    return true;
  } catch (error) {
    console.error('Error verifying storage:', error);
    return false;
  }
};
