import { InquiryModel } from './inquiry.model.js';

export const inquiryRepository = {
  create: (payload) => InquiryModel.create(payload),

  findById: (inquiryId) => InquiryModel.findById(inquiryId),

  list: ({ limit = 50, skip = 0, status }) => {
    const filter = {};
    if (status) {
      filter.status = status;
    }
    return InquiryModel.find(filter)
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  },

  count: (status) => {
    const filter = {};
    if (status) {
      filter.status = status;
    }
    return InquiryModel.countDocuments(filter);
  },

  updateStatus: (inquiryId, status, resolvedByUserId) =>
    InquiryModel.findByIdAndUpdate(
      inquiryId,
      {
        status,
        resolvedBy: status === 'resolved' ? resolvedByUserId : null,
        resolvedAt: status === 'resolved' ? new Date() : null,
      },
      { new: true },
    ).populate('resolvedBy', 'firstName lastName'),
};
