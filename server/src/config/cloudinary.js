import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { AppError } from '../shared/utils/app-error.js';

const isCloudinaryConfigured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const ensureCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured) {
    throw new AppError('Cloudinary is not configured on the server', 500);
  }
};

export { cloudinary };
