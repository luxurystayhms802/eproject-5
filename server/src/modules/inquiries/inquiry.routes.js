import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requirePermissions, requireRoles } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { inquiryController } from './inquiry.controller.js';
import { createInquirySchema } from './inquiry.validation.js';

export const inquiriesRouter = Router();

// Public endpoint (No Auth Required)
inquiriesRouter.post(
  '/public',
  validate(createInquirySchema),
  asyncHandler(inquiryController.createInquiry)
);

// Authenticated endpoints for staff
inquiriesRouter.use(authenticate);
inquiriesRouter.use(requireRoles('super_admin', 'admin', 'manager', 'receptionist'));

inquiriesRouter.get(
  '/',
  requirePermissions('inquiries.read'),
  asyncHandler(inquiryController.listInquiries)
);

inquiriesRouter.patch(
  '/:id/resolve',
  requirePermissions('inquiries.update'),
  asyncHandler(inquiryController.resolveInquiry)
);
