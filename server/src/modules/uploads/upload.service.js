import { cloudinary, ensureCloudinaryConfigured } from '../../config/cloudinary.js';

const uploadSingleBuffer = (file, folder) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: folder ? `luxurystay/${folder}` : 'luxurystay/admin',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        originalName: file.originalname,
      });
    },
  );

  uploadStream.end(file.buffer);
});

export const uploadService = {
  async uploadImages(files, folder) {
    ensureCloudinaryConfigured();
    const uploads = await Promise.all(files.map((file) => uploadSingleBuffer(file, folder)));

    return {
      items: uploads,
      urls: uploads.map((item) => item.url),
    };
  },
};
