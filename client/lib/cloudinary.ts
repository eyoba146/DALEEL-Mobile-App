const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'urbxorts';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'sbjkanpm';

/**
 * Uploads an image (base64 data URI or raw base64 from expo-image-picker) directly to Cloudinary
 * Uses standard JSON POST payload to completely bypass React Native FormData bugs on Android.
 * Returns the secure HTTPS URL of the uploaded image.
 */
export async function uploadImageToCloudinary(base64Data: string): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary environment variables are missing');
  }

  // Ensure valid data URI format
  let filePayload = base64Data;
  if (!filePayload.startsWith('data:')) {
    filePayload = `data:image/jpeg;base64,${base64Data}`;
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      file: filePayload,
      upload_preset: UPLOAD_PRESET,
      folder: 'daleel_avatars',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || 'Failed to upload photo to Cloudinary';
    console.error('Cloudinary upload failure:', errorData);
    throw new Error(message);
  }

  const data = await response.json();
  return data.secure_url;
}
