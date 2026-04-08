import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRoles } from '../../shared/middleware/authorize.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { AppError } from '../../shared/utils/app-error.js';
import { uploadController } from './upload.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 8,
  },
});

export const uploadsRouter = Router();

uploadsRouter.use(authenticate);


uploadsRouter.post(
  '/images',
  upload.array('files', 8),
  (request, _response, next) => {
    const files = request.files ?? [];
    const invalidFile = Array.isArray(files)
      ? files.find((file) => !String(file.mimetype ?? '').startsWith('image/'))
      : null;

    if (invalidFile) {
      next(new AppError('Only image files are allowed', 400));
      return;
    }

    next();
  },
  asyncHandler(uploadController.uploadImages),
);
