import { AppError } from '../../shared/utils/app-error.js';
import { inquiryRepository } from './inquiry.repository.js';

export const inquiryService = {
  createInquiry: async (payload) => {
    return inquiryRepository.create(payload);
  },

  listInquiries: async ({ page = 1, limit = 50, status }) => {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      inquiryRepository.list({ limit, skip, status }),
      inquiryRepository.count(status),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  resolveInquiry: async (inquiryId, resolvedByUserId) => {
    const inquiry = await inquiryRepository.findById(inquiryId);
    if (!inquiry) {
      throw new AppError('Inquiry not found', 404);
    }

    if (inquiry.status === 'resolved') {
        return inquiry;
    }

    return inquiryRepository.updateStatus(inquiryId, 'resolved', resolvedByUserId);
  },
};
