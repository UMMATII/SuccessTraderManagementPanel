import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Compresses and resizes an uploaded image file into a square avatar format.
 * Returns both a base64 Data URL and a compressed Blob.
 */
export async function processAvatarImage(
  file: File,
  maxDimension = 400,
  quality = 0.85
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file must be an image (PNG, JPG, WEBP, etc.)'));
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        // Center crop to square
        const minSide = Math.min(img.width, img.height);
        const startX = (img.width - minSide) / 2;
        const startY = (img.height - minSide) / 2;

        const targetSize = Math.min(minSide, maxDimension);
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          startX,
          startY,
          minSide,
          minSide,
          0,
          0,
          targetSize,
          targetSize
        );

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              reject(new Error('Failed to generate image blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file from disk'));
    reader.readAsDataURL(file);
  });
}

/**
 * Attempts to upload avatar to Supabase Storage if bucket exists,
 * otherwise falls back seamlessly to the compressed Base64 Data URL.
 */
export async function uploadAvatar(
  file: File,
  userId?: string
): Promise<{ url: string; error?: string }> {
  try {
    const { dataUrl, blob } = await processAvatarImage(file, 400, 0.85);

    // If Supabase is configured, attempt upload to 'avatars' storage bucket
    if (isSupabaseConfigured()) {
      try {
        const fileExt = 'jpg';
        const fileName = `${userId || 'user'}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            return { url: publicUrlData.publicUrl };
          }
        }
      } catch {
        // Fall back to dataUrl if storage bucket is missing or RLS restricted
      }
    }

    // Direct dataUrl fallback (persists directly in profiles.avatar_url column)
    return { url: dataUrl };
  } catch (err: any) {
    return { url: '', error: err.message || 'Failed to process image' };
  }
}
