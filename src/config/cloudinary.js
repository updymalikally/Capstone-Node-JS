import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Upload buffer stream to Cloudinary
 * @param {Buffer} buffer 
 * @param {string} folder 
 * @returns {Promise<Object>}
 */
export const uploadBufferToCloudinary = (buffer, folder = 'profile_pictures') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary credentials are not properly set, provide a clean fallback or simulate
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'demo_cloud' || !process.env.CLOUDINARY_API_KEY) {
      // Return a structured data URL or placeholder if Cloudinary is not configured yet
      const base64 = buffer.toString('base64');
      const dataUri = `data:image/jpeg;base64,${base64.substring(0, 100)}...`;
      return resolve({
        secure_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
        public_id: `fallback_${Date.now()}`,
        format: 'jpg',
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

export default cloudinary;
