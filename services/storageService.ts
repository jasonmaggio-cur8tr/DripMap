import { supabase } from '../lib/supabase';
import { resetSupabaseAuthState } from '../lib/authUtils';

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
      console.error('No active session found for upload:', sessionError);
      
      // Reset auth state to clear corrupted localStorage tokens
      await resetSupabaseAuthState();
      
      throw new Error('Your session has expired or is invalid. Please log in again to continue.');
    }
    
    // Check if token is about to expire and refresh if needed
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    
    if (expiresAt < now) {
      console.log('Session expired, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        console.error('Failed to refresh session:', refreshError);
        
        // Reset auth state to clear corrupted/stale tokens
        await resetSupabaseAuthState();
        
        throw new Error('Your session has expired and could not be refreshed. Please log in again to continue.');
      }
      
      session = refreshedSession;
      console.log('Session refreshed successfully');
    }
    
    console.log('User authenticated, session valid until:', new Date(expiresAt));

    // Bucket existence verified on app init - proceed directly to upload
    console.log(`Uploading to bucket: ${BUCKET_NAME}...`);

    // Upload to Supabase Storage with retries & per-attempt timeouts
    const doUpload = async (useUpsert: boolean = false) => {
      return supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: useUpsert
        });
    };

    // Helper to attempt a single upload with a per-attempt timeout
    const attemptUploadWithTimeout = async (timeoutMs: number, useUpsert: boolean = false) => {
      const uploadPromise = doUpload(useUpsert);
      uploadPromise.then((res: any) => console.log('uploadPromise resolved for', fileName, res)).catch((err: any) => console.error('uploadPromise rejected for', fileName, err));

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Upload timeout after ${timeoutMs / 1000}s - check Supabase storage configuration, RLS policies, and internet connection`)), timeoutMs)
      );

      return await Promise.race([uploadPromise, timeoutPromise]) as any;
    };

    // Try multiple attempts with increasing timeouts and exponential backoff
    const maxAttempts = 3;
    let attempt = 0;
    let data: any = null;
    let error: any = null;

    while (attempt < maxAttempts) {
      attempt += 1;
      const timeoutForAttempt = attempt === 1 ? 30000 : (attempt === 2 ? 60000 : 120000);
      console.log(`Attempt ${attempt}/${maxAttempts} for upload ${fileName} (timeout ${timeoutForAttempt}ms)`);

      try {
        // On retry attempts, use upsert to overwrite if file already exists from failed previous attempt
        const useUpsert = attempt > 1;
        const result = await attemptUploadWithTimeout(timeoutForAttempt, useUpsert);
        data = result.data;
        error = result.error;

        // If success, break out
        if (!error) break;

        // Check if it's a "resource already exists" error
        const isAlreadyExistsError = error && (error.message?.toLowerCase?.().includes('already exists') || error.statusCode === '409');
        if (isAlreadyExistsError) {
          console.warn('File already exists, will use upsert on next attempt:', error);
          // Continue to next attempt with upsert enabled
        }

        // If it's an auth-related error, try refreshing the session once and continue retries
        const isAuthError = error && (error.message?.toLowerCase?.().includes('jwt') || error.message?.toLowerCase?.().includes('expired') || error.status === 401 || error.status === 403 || error.message?.toLowerCase?.().includes('unauthorized'));
        if (isAuthError) {
          console.warn('Auth-related upload error detected; attempting to refresh session before next attempt', error);
          try {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshedSession) {
              console.error('Session refresh failed during upload retry:', refreshError);

              // Reset auth state to clear corrupted/stale tokens
              await resetSupabaseAuthState();

              throw new Error('Your session is invalid and could not be refreshed. Please log in again.');
            }
            console.log('Session refreshed successfully during upload retry');
          } catch (refreshErr) {
            console.error('Error while attempting session refresh during upload retry:', refreshErr);

            // Reset auth state before re-throwing
            await resetSupabaseAuthState();

            break;
          }
        }
      } catch (err: any) {
        console.error(`Attempt ${attempt} for ${fileName} failed:`, err);
        error = err;
      }

      if (attempt < maxAttempts) {
        const backoffMs = 250 * Math.pow(2, attempt - 1);
        console.log(`Waiting ${backoffMs}ms before retrying ${fileName}`);
        await new Promise(res => setTimeout(res, backoffMs));
      }
    }

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

    // Check for auth/session errors first
    if (errorMessage.includes('JWT') || errorMessage.includes('session') || errorMessage.includes('expired') || errorMessage.includes('401')) {
      errorMessage = 'Your session has expired. Please log in again to continue uploading.';
    } else if (errorMessage.includes('timeout')) {
      errorMessage = 'Upload timed out. The file may be too large or your connection is slow. Please try again with smaller images.';
    } else if (errorMessage.includes('not found')) {
      errorMessage = `Storage bucket \"${BUCKET_NAME}\" not found. Please contact support.`;
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
