import { sendSuccess } from '../../shared/utils/api-response.js';
import { inquiryService } from './inquiry.service.js';

export const inquiryController = {
  createInquiry: async (request, response) => {
    const inquiry = await inquiryService.createInquiry(request.body);
    return sendSuccess(response, {
      message: 'Inquiry submitted successfully',
      data: inquiry,
      statusCode: 201,
    });
  },

  listInquiries: async (request, response) => {
    const { page, limit, status } = request.query;
    
    const result = await inquiryService.listInquiries({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      status,
    });

    return sendSuccess(response, {
      message: 'Inquiries fetched successfully',
      data: result,
    });
  },

  resolveInquiry: async (request, response) => {
    const { id } = request.params;
    const resolvedByUserId = request.authUser.id;
    
    const inquiry = await inquiryService.resolveInquiry(id, resolvedByUserId);

    return sendSuccess(response, {
      message: 'Inquiry resolved successfully',
      data: inquiry,
    });
  },
};
