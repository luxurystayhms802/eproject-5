import { FaqModel } from './faq.model.js';

export const getFaqs = async (request, response) => {
  try {
    const { isActive } = request.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const faqs = await FaqModel.find(query).sort({ order: 1, createdAt: -1 });

    return response.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message,
    });
  }
};

export const createFaq = async (request, response) => {
  try {
    const faq = await FaqModel.create(request.body);

    return response.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: 'Failed to create FAQ',
      error: error.message,
    });
  }
};

export const updateFaq = async (request, response) => {
  try {
    const { id } = request.params;
    const faq = await FaqModel.findByIdAndUpdate(id, request.body, {
      new: true,
      runValidators: true,
    });

    if (!faq) {
      return response.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    return response.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: 'Failed to update FAQ',
      error: error.message,
    });
  }
};

export const deleteFaq = async (request, response) => {
  try {
    const { id } = request.params;
    const faq = await FaqModel.findByIdAndDelete(id);

    if (!faq) {
      return response.status(404).json({
        success: false,
        message: 'FAQ not found',
      });
    }

    return response.json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error) {
    return response.status(500).json({
      success: false,
      message: 'Failed to delete FAQ',
      error: error.message,
    });
  }
};
