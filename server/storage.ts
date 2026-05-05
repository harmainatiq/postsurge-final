// Cloudinary storage implementation
import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './_core/env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: ENV.cloudinaryCloudName,
  api_key: ENV.cloudinaryApiKey,
  api_secret: ENV.cloudinaryApiSecret,
});

function validateConfig() {
  if (!ENV.cloudinaryCloudName || !ENV.cloudinaryApiKey || !ENV.cloudinaryApiSecret) {
    throw new Error(
      "Cloudinary credentials missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET"
    );
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  validateConfig();

  const buffer = Buffer.isBuffer(data) 
    ? data 
    : typeof data === 'string' 
    ? Buffer.from(data) 
    : Buffer.from(data);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'social-media-posts',
        public_id: relKey.replace(/\//g, '_'),
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            key: relKey,
            url: result.secure_url,
          });
        } else {
          reject(new Error('Cloudinary upload failed: no result'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export async function storagePutDataUrl(dataUrl: string): Promise<{ url: string }> {
  validateConfig();
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: "social-media-posts",
    resource_type: "image",
  });
  return { url: result.secure_url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  validateConfig();
  
  // Generate Cloudinary URL for the resource
  const publicId = `social-media-posts/${relKey.replace(/\//g, '_')}`;
  const url = cloudinary.url(publicId, {
    secure: true,
    resource_type: 'auto',
  });

  return { key: relKey, url };
}
