import { supabase } from '../lib/supabase';
import { resetSupabaseAuthState } from '../lib/authUtils';

const BUCKET_NAME = 'shop-images';

/** Max pixel dimension (longest side) for uploaded images */
const MAX_DIMENSION = 1280;
/** Compression quality for JPEG/WebP output (0-1) */
const COMPRESS_QUALITY = 0.75;
/** Skip compression for files already under this size */
const COMPRESS_THRESHOLD = 100 * 1024; // 100 KB
/** Hard cap after compression — reject if still over this */
const POST_COMPRESS_MAX = 3 * 1024 * 1024; // 3 MB

/**
 * Detect WebP encoding support via Canvas API (cached at module load)
 */
const supportsWebP = (() => {
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
})();

/**
 * Compress and resize an image for web delivery.
 * - Caps the longest side at MAX_DIMENSION (1600 px)
 * - Re-encodes as WebP (preferred) or JPEG at COMPRESS_QUALITY
 * - Falls back to the original file if compression doesn't reduce size
 */
const compressForWeb = (file: File): Promise<File> => {
  // Skip animated GIFs and already-tiny files
  if (file.type === 'image/gif') return Promise.resolve(file);
  if (file.size <= COMPRESS_THRESHOLD) return Promise.resolve(file);

  const compressionPromise = new Promise<File>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Down-scale if either dimension exceeds the cap
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      const outputType = supportsWebP ? 'image/webp' : 'image/jpeg';
      const ext = supportsWebP ? 'webp' : 'jpg';

      try {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
              resolve(new File([blob], newName, { type: outputType }));
            } else {
              resolve(file); // Keep original if compression didn't help
            }
          },
          outputType,
          COMPRESS_QUALITY
        );
      } catch (err) {
        resolve(file); // Fallback if toBlob throws
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });

  const timeoutPromise = new Promise<File>((resolve) => 
    setTimeout(() => resolve(file), 15000)
  );

  return Promise.race([compressionPromise, timeoutPromise]);
};

/**
 * Convert HEIC/HEIF image to JPEG
 * @param file - The HEIC/HEIF file to convert
 * @returns A JPEG file or the original file if conversion fails
 */
const convertHEICtoJPEG = async (file: File): Promise<File> => {
  const conversionPromise = new Promise<File>((resolve) => {
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
        
        try {
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
        } catch (err) {
          resolve(file); // Fallback
        }
      };
      
      img.onerror = () => resolve(file); // Fallback to original
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => resolve(file); // Fallback to original
    reader.readAsDataURL(file);
  });

  const timeoutPromise = new Promise<File>((resolve) => 
    setTimeout(() => resolve(file), 15000)
  );

  return Promise.race([conversionPromise, timeoutPromise]);
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

  // Compress and resize for web
  const originalSize = processedFile.size;
  processedFile = await compressForWeb(processedFile);
  if (processedFile.size < originalSize) {
    console.log(`Compressed: ${(originalSize / 1024).toFixed(0)}KB → ${(processedFile.size / 1024).toFixed(0)}KB (${((1 - processedFile.size / originalSize) * 100).toFixed(0)}% reduction)`);
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(processedFile.type)) {
    throw new Error(`Invalid file type: ${processedFile.type}. Please upload an image (JPG, PNG, WebP, or GIF). HEIC/HEIF images from iPhone are automatically converted.`);
  }

  // Validate file size (max 3MB after compression — helps mobile uploads)
  const maxSize = POST_COMPRESS_MAX;
  if (processedFile.size > maxSize) {
    throw new Error(`Image is too large (${(processedFile.size / (1024*1024)).toFixed(1)}MB after compression). Please use a smaller photo or reduce your camera resolution in Settings → Camera.`);
  }

  // Generate unique filename
  const fileExt = processedFile.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  console.log('Uploading to:', fileName);

  try {
    // Check if user is authenticated — wrap with timeout because getSession() can
    // make a network call on mobile (token refresh) with no built-in timeout.
    const sessionTimeout = <T>(promise: Promise<T>): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timed out. Please check your connection.')), 5000)
        )
      ]);

    let { data: { session }, error: sessionError } = await sessionTimeout(supabase.auth.getSession());
    
    if (sessionError || !session) {
      console.error('No active session found for upload:', sessionError);
      await resetSupabaseAuthState();
      throw new Error('Your session has expired or is invalid. Please log in again to continue.');
    }
    
    // Check if token is about to expire and refresh if needed
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    
    if (expiresAt < now) {
      console.log('Session expired, attempting to refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await sessionTimeout(
        supabase.auth.refreshSession()
      );
      
      if (refreshError || !refreshedSession) {
        console.error('Failed to refresh session:', refreshError);
        await resetSupabaseAuthState();
        throw new Error('Your session has expired and could not be refreshed. Please log in again to continue.');
      }
      
      session = refreshedSession;
      console.log('Session refreshed successfully');
    }
    
    console.log('User authenticated, session valid until:', new Date(expiresAt));

    // --- XHR-based upload (more reliable on iOS Safari than fetch) ---
    // fetch() + Promise.race leaves zombie requests running on timeout (does NOT cancel the
    // underlying TCP connection). XHR's native .timeout property actually aborts the connection.
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

    const uploadViaXHR = (useUpsert: boolean, timeoutMs: number): Promise<void> =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(useUpsert ? 'PUT' : 'POST', `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`);
        xhr.setRequestHeader('Authorization', `Bearer ${session!.access_token}`);
        xhr.setRequestHeader('apikey', supabaseAnonKey);
        xhr.setRequestHeader('Content-Type', processedFile.type || 'application/octet-stream');
        xhr.setRequestHeader('x-upsert', useUpsert ? 'true' : 'false');
        xhr.setRequestHeader('Cache-Control', '31536000');
        xhr.timeout = timeoutMs; // native abort — actually kills the TCP connection

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.message || `Upload failed (${xhr.status})`));
            } catch {
              reject(new Error(`Upload failed (${xhr.status}): ${xhr.statusText}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload. Check your connection and try again.'));
        xhr.ontimeout = () => reject(new Error(`Upload timed out after ${Math.round(timeoutMs / 1000)}s. Your connection may be slow — please try again.`));

        xhr.send(processedFile);
      });

    // 2 attempts: 60 s then 90 s. XHR actually cancels on timeout — no zombie-request stacking.
    const maxAttempts = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const timeoutMs = attempt === 1 ? 60_000 : 90_000;
      const useUpsert = attempt > 1;
      console.log(`XHR upload attempt ${attempt}/${maxAttempts} — timeout ${timeoutMs / 1000}s, upsert=${useUpsert}`);
      try {
        await uploadViaXHR(useUpsert, timeoutMs);
        lastError = null;
        break; // success
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err?.message ?? err));
        console.error(`XHR upload attempt ${attempt} failed:`, lastError.message);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }

    if (lastError) throw lastError;

    // Get public URL (local computation — no network call)
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

    let errorMessage = error.message || 'Failed to upload image';

    if (errorMessage.includes('JWT') || errorMessage.includes('session') || errorMessage.includes('expired') || errorMessage.includes('401')) {
      errorMessage = 'Your session has expired. Please log in again to continue uploading.';
    } else if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
      errorMessage = 'Upload timed out. Try again — if it keeps failing, use a smaller photo.';
    } else if (errorMessage.includes('not found')) {
      errorMessage = `Storage bucket "${BUCKET_NAME}" not found. Please contact support.`;
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
