import { sendSuccess } from '../../shared/utils/api-response.js';
import { AppError } from '../../shared/utils/app-error.js';
import { uploadService } from './upload.service.js';

export const uploadController = {
  uploadImages: async (request, response) => {
    const files = request.files ?? [];

    if (!Array.isArray(files) || files.length === 0) {
      throw new AppError('At least one image file is required', 400);
    }

    const result = await uploadService.uploadImages(files, request.body.folder);

    return sendSuccess(response, {
      message: 'Images uploaded successfully',
      data: result,
      statusCode: 201,
    });
  },
};
