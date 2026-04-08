import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requirePermissions } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { createFaq, deleteFaq, getFaqs, updateFaq } from './faq.controller.js';
import { createFaqSchema, getFaqSchema, updateFaqSchema } from './faq.validation.js';

const router = Router();

// Public route for retrieving FAQs
router.get('/', getFaqs);

// Protected routes (admin/staff only)
router.use(authenticate);

router.post(
  '/',
  requirePermissions('faqs.create'),
  validate(createFaqSchema),
  createFaq
);

router.put(
  '/:id',
  requirePermissions('faqs.update'),
  validate(updateFaqSchema),
  updateFaq
);

router.delete(
  '/:id',
  requirePermissions('faqs.delete'),
  validate(getFaqSchema),
  deleteFaq
);

export { router as faqsRouter };
