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
    throw new Error(`Invalid file type: ${processedFile.type}. Please upload an image (JPG, PNG, WebP, or GIF). HEIC/HEIF images from iPhone are automatically converted.`);
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (processedFile.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB');
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
      throw new Error('Your session has expired. Please log out and log back in to continue.');
    }
    
    // Check if token is about to expire and refresh if needed
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    
    if (expiresAt < now) {
      console.log('Session expired, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        console.error('Failed to refresh session:', refreshError);
        throw new Error('Your session has expired. Please log out and log back in to continue uploading.');
      }
      
      session = refreshedSession;
      console.log('Session refreshed successfully');
    }
    
    console.log('User authenticated, session valid until:', new Date(expiresAt));

    // Bucket existence verified on app init - proceed directly to upload
    console.log(`Uploading to bucket: ${BUCKET_NAME}...`);

    // Upload to Supabase Storage with timeout
    const uploadPromise = supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, processedFile, {
        cacheControl: '3600',
        upsert: false
      });

    // Also attach listeners to the underlying upload promise so we can see in the console when it resolves or rejects
    // (this will still allow Promise.race below to handle timeout)
    uploadPromise.then((res: any) => console.log('uploadPromise resolved for', fileName, res)).catch((err: any) => console.error('uploadPromise rejected for', fileName, err));

    // Add 120 second timeout - uploads may take longer on slow networks and we want to make the timeout diagnostic rather than immediate
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 120s - check Supabase storage configuration, RLS policies, and internet connection')), 120000)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

    console.log('Upload response - data:', data, 'error:', error);

    if (error) {
      // Bubble up the underlying Supabase error so callers (UI) see the real reason
      console.error('Supabase upload error:', error);
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

    // Convert some known issues into clearer messages, then rethrow so callers see the reason
    let errorMessage = error.message || 'Failed to upload image';

    if (errorMessage.includes('timeout')) {
      errorMessage = 'Upload timed out after 30s. Possible causes:\n• Supabase storage bucket not configured correctly\n• Storage RLS policies blocking uploads\n• Network connectivity issues\n\nPlease check STORAGE_SETUP.md for configuration steps.';
    } else if (errorMessage.includes('not found')) {
      errorMessage = `Storage bucket "${BUCKET_NAME}" not found. Please:\n1. Go to Supabase Dashboard > Storage\n2. Create bucket named "${BUCKET_NAME}"\n3. Enable "Public bucket"\n4. Add RLS policies for authenticated uploads`;
    }

    throw new Error(errorMessage);
  }
};

/**
 * Upload multiple images
 */
export const uploadImages = async (
  files: File[],
  folder: string = 'shops',
  onProgress?: (completed: number, total: number, fileName?: string) => void
): Promise<{ success: boolean; urls?: string[]; error?: any }> => {
  console.log(`Starting sequential upload of ${files.length} files...`);

  const urls: string[] = [];

  // Upload files one-by-one to avoid concurrency issues (session refresh, RLS, or network) that can make parallel uploads hang.
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Uploading file ${i + 1}/${files.length}: ${file.name}`);

    // uploadImage will throw on any error — bubble that up so callers can surface it in UI
    const result = await uploadImage(file, folder);

    if (!result || !result.success || !result.url) {
      // Defensive: If uploadImage returns a non-throwing error result, convert to thrown Error
      const errMsg = (result && (result as any).error) || 'Unknown upload failure';
      console.error(`Failed to upload file ${file.name}:`, errMsg);
      throw new Error(errMsg);
    }

    console.log(`Uploaded file ${i + 1}/${files.length}: ${file.name} -> ${result.url}`);
    if (onProgress) onProgress(i + 1, files.length, file.name);
    urls.push(result.url);
  }

  console.log('All files uploaded sequentially, URLs:', urls);
  return { success: true, urls };
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
    
    // Try to list files in the bucket to verify it exists and is accessible
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
      limit: 1
    });
    
    if (error) {
      // Check if it's a "not found" error
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        console.error(`❌ Bucket "${BUCKET_NAME}" not found!`);
        console.warn(`⚠️ Please create the "${BUCKET_NAME}" bucket in Supabase Dashboard:`);
        console.warn('1. Go to https://supabase.com/dashboard/project/zxetnactllyzslievgxj/storage');
        console.warn('2. Click "New Bucket"');
        console.warn(`3. Name: "${BUCKET_NAME}"`);
        console.warn('4. Enable "Public bucket" ✅');
        console.warn('5. Set file size limit to 5MB (5242880 bytes)');
        return false;
      }
      
      // Other errors (like permission issues) - log but don't fail
      console.warn('⚠️ Storage check error:', error.message);
      console.log('Assuming bucket exists, continuing...');
      return true;
    }

    console.log(`✅ Storage bucket "${BUCKET_NAME}" verified and accessible`);
    return true;
  } catch (error) {
    console.error('Error verifying storage:', error);
    // Don't fail on errors - assume bucket exists
    return true;
  }
};
